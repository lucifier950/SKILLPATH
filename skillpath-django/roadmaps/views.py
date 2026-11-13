"""Roadmap API — port of backend/controllers/roadmapController.js."""

import json
import logging

from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.forms import modelform_factory
from django.http import JsonResponse, StreamingHttpResponse
from django.utils import timezone

from skillpath.api import ApiError, api_view, first_error
from skillpath.ratelimit import ai_limit

from . import ai
from .models import Roadmap, Step

logger = logging.getLogger(__name__)
RoadmapForm = modelform_factory(Roadmap, fields=["goal", "level", "weekly_hours"])
EXPLAIN_MODES = {"explain", "simplify", "example", "analogy"}


def step_json(step):
    return {
        "_id": str(step.pk),
        "stepNumber": step.number,
        "title": step.title,
        "description": step.description,
        "duration": step.duration,
        "resources": step.resources,
        "completed": step.completed,
        "completedAt": step.completed_at,
    }


def roadmap_json(roadmap):
    return {
        "_id": str(roadmap.pk),
        "user": str(roadmap.user_id),
        "goal": roadmap.goal,
        "level": roadmap.level,
        "weeklyHours": roadmap.weekly_hours,
        "estimatedDuration": roadmap.estimated_duration,
        "steps": [step_json(s) for s in roadmap.steps.all()],
        "createdAt": roadmap.created_at,
        "updatedAt": roadmap.updated_at,
    }


def sse(events):
    """Server-Sent Events over a streaming response, in the exact `data: {...}\\n\\n` framing the UI parses."""
    body = (f"data: {json.dumps(event, cls=DjangoJSONEncoder)}\n\n" for event in events)
    response = StreamingHttpResponse(body, content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"  # stop Nginx-style proxies buffering the stream
    return response


def validated_form(data):
    if not all(data.get(field) for field in ("goal", "level", "weeklyHours")):
        raise ApiError(400, "Please fill all the fields")
    form = RoadmapForm({"goal": data["goal"], "level": data["level"], "weekly_hours": data["weeklyHours"]})
    if not form.is_valid():
        raise ApiError(400, first_error(form))
    return form


def save_roadmap(user, form, plan):
    with transaction.atomic():
        roadmap = form.save(commit=False)
        roadmap.user = user
        roadmap.estimated_duration = plan["estimated_duration"]
        roadmap.save()
        Step.objects.bulk_create(Step(roadmap=roadmap, **step) for step in plan["steps"])
    return roadmap


def owned(request, pk, step_id, action):
    """Mirror the Express checks: 404 if missing, 403 if it belongs to someone else, 404 for a bad step."""
    roadmap = Roadmap.objects.filter(pk=pk).first()
    if roadmap is None:
        raise ApiError(404, "Roadmap not found")
    if roadmap.user_id != request.user.pk:
        raise ApiError(403, f"Not authorized to {action} this roadmap")
    step = roadmap.steps.filter(pk=step_id).first()
    if step is None:
        raise ApiError(404, "Step not found")
    return roadmap, step


@api_view("GET", "POST", login_required=True)
@ai_limit
def roadmaps(request):
    if request.method == "GET":
        mine = request.user.roadmaps.prefetch_related("steps")
        return JsonResponse([roadmap_json(r) for r in mine], safe=False)
    form = validated_form(request.data)
    try:
        plan = ai.generate_roadmap(form.cleaned_data["goal"], form.cleaned_data["level"], form.cleaned_data["weekly_hours"])
    except ai.AIError as exc:
        raise ApiError(502, str(exc))
    return JsonResponse(roadmap_json(save_roadmap(request.user, form, plan)), status=201)


@api_view("POST", login_required=True)
@ai_limit
def create_stream(request):
    form = validated_form(request.data)  # validation errors are still plain JSON 400s
    data = form.cleaned_data

    def events():
        try:
            plan = None
            for event in ai.roadmap_events(data["goal"], data["level"], data["weekly_hours"]):
                if event["type"] == "complete":
                    plan = event["data"]
                else:
                    yield event
            yield {"type": "done", "roadmap": roadmap_json(save_roadmap(request.user, form, plan))}
        except ai.AIError as exc:
            yield {"type": "error", "message": str(exc)}
        except Exception:  # headers are already sent, so errors must travel inside the stream
            logger.exception("Roadmap stream failed")
            yield {"type": "error", "message": "Roadmap generation failed"}

    return sse(events())


@api_view("POST", login_required=True)
@ai_limit
def enhance(request):
    goal = str(request.data.get("goal") or "").strip()
    if not goal:
        raise ApiError(400, "Please enter a goal to expand")
    try:
        return JsonResponse({"goal": ai.enhance_goal(goal)})
    except ai.AIError as exc:
        raise ApiError(502, str(exc))


@api_view("PATCH", login_required=True)
def toggle_step(request, pk, step_id):
    roadmap, step = owned(request, pk, step_id, "modify")
    step.completed_at = None if step.completed else timezone.now()
    step.save(update_fields=["completed_at"])
    roadmap.save(update_fields=["updated_at"])
    return JsonResponse(roadmap_json(roadmap))


@api_view("POST", login_required=True)
@ai_limit
def explain_step(request, pk, step_id):
    roadmap, step = owned(request, pk, step_id, "view")  # checked before the stream opens
    mode = request.data.get("mode") if request.data.get("mode") in EXPLAIN_MODES else "explain"

    def events():
        try:
            for text in ai.explanation_stream(roadmap, step, mode):
                if text:
                    yield {"type": "chunk", "text": text}
            yield {"type": "done"}
        except ai.AIError as exc:
            yield {"type": "error", "message": str(exc)}
        except Exception:
            logger.exception("Explanation stream failed")
            yield {"type": "error", "message": "Explanation failed"}

    return sse(events())
