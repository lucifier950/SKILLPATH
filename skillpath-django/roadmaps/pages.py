"""Server-rendered pages (Django templates + generic views): full CRUD with forms, and a progress report.

They live beside the React app and share its session — sign in once at /login and both work.
Every query goes through the logged-in user's own roadmaps, so another user's id is a 404.
"""

import csv

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.db.models import Count, Q
from django.http import HttpResponse
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views import generic

from skillpath.ratelimit import ai_limit

from . import ai
from .models import Level, Step
from .views import RoadmapForm, save_roadmap


def my_roadmaps(user):
    """The user's roadmaps, each annotated with its step count and completed-step count."""
    return user.roadmaps.annotate(
        total=Count("steps"), done=Count("steps", filter=Q(steps__completed_at__isnull=False))
    )


class OwnRoadmapMixin(LoginRequiredMixin):
    def get_queryset(self):
        return my_roadmaps(self.request.user)


class RoadmapList(OwnRoadmapMixin, generic.ListView):
    """Read + report: search/filter, per-roadmap progress, totals, level breakdown, recent activity."""

    def get_queryset(self):
        roadmaps = super().get_queryset()
        if query := self.request.GET.get("q", "").strip():
            roadmaps = roadmaps.filter(goal__icontains=query)
        if (level := self.request.GET.get("level")) in Level.values:
            roadmaps = roadmaps.filter(level=level)
        return roadmaps

    def get_context_data(self, **kwargs):
        user = self.request.user
        steps = Step.objects.filter(roadmap__user=user)
        return super().get_context_data(
            roadmap_count=user.roadmaps.count(),
            totals=steps.aggregate(total=Count("id"), done=Count("id", filter=Q(completed_at__isnull=False))),
            by_level=user.roadmaps.values("level").annotate(count=Count("id")).order_by("level"),
            recent=steps.filter(completed_at__isnull=False).select_related("roadmap").order_by("-completed_at")[:5],
            levels=Level.choices,
            **kwargs,
        )


class RoadmapDetail(OwnRoadmapMixin, generic.DetailView):
    pass


@method_decorator(ai_limit, name="dispatch")  # same AI quota as the API (POSTs only)
class RoadmapCreate(LoginRequiredMixin, generic.CreateView):
    form_class = RoadmapForm
    template_name = "roadmaps/roadmap_form.html"

    def form_valid(self, form):
        data = form.cleaned_data
        try:
            plan = ai.generate_roadmap(data["goal"], data["level"], data["weekly_hours"])
        except ai.AIError as exc:
            form.add_error(None, str(exc))
            return self.form_invalid(form)
        roadmap = save_roadmap(self.request.user, form, plan)
        return redirect(roadmap)


class RoadmapUpdate(OwnRoadmapMixin, SuccessMessageMixin, generic.UpdateView):
    form_class = RoadmapForm
    success_message = "Roadmap updated."


class RoadmapDelete(OwnRoadmapMixin, SuccessMessageMixin, generic.DeleteView):
    success_url = reverse_lazy("roadmap_list")
    success_message = "Roadmap deleted."


@login_required
def export_csv(request):
    """Download the progress report as a spreadsheet."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="skillpath-report.csv"'
    writer = csv.writer(response)
    writer.writerow(["Goal", "Level", "Weekly hours", "Estimated duration", "Steps", "Completed", "Progress %", "Created"])
    for r in my_roadmaps(request.user):
        progress = round(100 * r.done / r.total) if r.total else 0
        writer.writerow([r.goal, r.level, r.weekly_hours, r.estimated_duration, r.total, r.done, progress, r.created_at.date()])
    return response
