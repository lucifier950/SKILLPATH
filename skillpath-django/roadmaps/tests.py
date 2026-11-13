import json
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.test import SimpleTestCase, TestCase, override_settings
from django.utils import timezone

from . import ai
from .models import Roadmap, Step

AI_JSON = json.dumps(
    {
        "estimatedDuration": "6 weeks",
        "steps": [
            {"stepNumber": 1, "title": "Python {basics}", "description": 'Syntax, "quotes" and {braces}',
             "duration": "2 weeks", "resources": ["docs.python.org"]},
            {"stepNumber": 7, "title": "Django ORM", "description": "Models", "duration": "4 weeks", "resources": []},
        ],
    }
)
STREAM = "roadmaps.ai.stream_text"


def chunks(text, size=17):
    """Fake AI stream: the answer arrives in small pieces, like real text deltas."""
    return lambda *args, **kwargs: iter([text[i : i + size] for i in range(0, len(text), size)])


def sse_events(response):
    body = b"".join(response.streaming_content).decode()
    return [json.loads(block[6:]) for block in body.split("\n\n") if block.startswith("data: ")]


class ParsingTests(SimpleTestCase):
    def test_valid_output_is_normalised(self):
        plan = ai.parse_roadmap(AI_JSON)
        self.assertEqual(plan["estimated_duration"], "6 weeks")
        self.assertEqual([s["number"] for s in plan["steps"]], [1, 2])  # AI numbering ignored

    def test_malformed_output_is_rejected(self):
        bad_outputs = [
            "Sorry, here is your roadmap!",
            '{"estimatedDuration": "6 weeks", "steps": [',  # truncated
            "[]",
            '{"steps": []}',
            '{"steps": [{"description": "no title"}]}',
            '{"steps": [{"title": "x", "resources": "not a list"}]}',
            json.dumps({"steps": [{"title": "x"}] * (ai.MAX_STEPS + 1)}),
        ]
        for bad in bad_outputs:
            with self.subTest(bad=bad[:40]), self.assertRaises(ai.AIError):
                ai.parse_roadmap(bad)

    def test_complete_steps_reads_partial_json(self):
        cut = AI_JSON.index("Django ORM")
        steps = ai.complete_steps(AI_JSON[:cut])
        self.assertEqual([s["title"] for s in steps], ["Python {basics}"])  # braces in strings don't confuse it
        self.assertEqual(len(ai.complete_steps(AI_JSON)), 2)

    @patch(STREAM)
    def test_every_mentor_mode_asks_for_youtube_and_study_sites(self, stream):
        roadmap, step = Roadmap(goal="Django", level="beginner"), Step(title="ORM", description="Models")
        for mode in ["explain", "simplify", "example", "analogy"]:
            with self.subTest(mode=mode):
                ai.explanation_stream(roadmap, step, mode)
                prompt = stream.call_args.args[0]
                self.assertIn("## Watch & read", prompt)
                self.assertIn("https://www.youtube.com/results?search_query=", prompt)


@override_settings(GROQ_API_KEY="test-key")
class GroqClientTests(SimpleTestCase):
    @patch("roadmaps.ai.requests.post")
    def test_request_shape_stream_parsing_and_rate_limit(self, post):
        fenced = f"```json\n{AI_JSON}\n```"  # models sometimes wrap JSON in fences
        lines = [b"data: " + json.dumps({"choices": [{"delta": {"content": fenced[i : i + 40]}}]}).encode()
                 for i in range(0, len(fenced), 40)]
        response = post.return_value.__enter__.return_value
        response.status_code, response.ok, response.text = 200, True, ""
        response.iter_lines.return_value = [*lines, b"", b"data: [DONE]"]

        self.assertEqual(len(ai.generate_roadmap("Django", "beginner", 5)["steps"]), 2)
        sent = post.call_args.kwargs
        self.assertEqual(sent["json"]["model"], "openai/gpt-oss-120b")
        self.assertTrue(sent["json"]["stream"])
        self.assertEqual(sent["headers"]["Authorization"], "Bearer test-key")

        response.status_code, response.ok, response.text = 429, False, "rate limited"
        with self.assertLogs("roadmaps.ai", "WARNING"), self.assertRaisesMessage(ai.AIError, "busy"):
            ai.generate_roadmap("Django", "beginner", 5)

    @override_settings(GROQ_API_KEY="")
    def test_missing_api_key_gives_safe_error(self):
        with self.assertRaisesMessage(ai.AIError, "AI service is not configured"):
            ai.generate_roadmap("Django", "beginner", 5)


class RoadmapApiTestCase(TestCase):
    form = {"goal": "Django", "level": "beginner", "weeklyHours": 5}

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("owner@example.com", password="pw-owner-123")
        self.client.force_login(self.user)

    def post(self, url, data=None):
        return self.client.post(url, data or {}, content_type="application/json")

    def make_roadmap(self, user=None, goal="Django", steps=2):
        roadmap = Roadmap.objects.create(user=user or self.user, goal=goal, level="beginner", weekly_hours=5)
        Step.objects.bulk_create(Step(roadmap=roadmap, number=n, title=f"Step {n}") for n in range(1, steps + 1))
        return roadmap


class GenerateRoadmapTests(RoadmapApiTestCase):
    @patch(STREAM, side_effect=chunks(AI_JSON))
    def test_stream_emits_meta_steps_then_saved_roadmap(self, _stream):
        response = self.post("/api/roadmaps/stream", self.form)
        self.assertEqual(response["Content-Type"], "text/event-stream")
        events = sse_events(response)
        self.assertEqual([e["type"] for e in events], ["meta", "step", "step", "done"])
        self.assertEqual(events[0]["estimatedDuration"], "6 weeks")
        self.assertEqual([e["index"] for e in events[1:3]], [0, 1])
        saved = events[-1]["roadmap"]
        roadmap = Roadmap.objects.get()
        self.assertEqual((saved["_id"], saved["weeklyHours"], roadmap.user), (str(roadmap.pk), 5, self.user))
        self.assertEqual([s["stepNumber"] for s in saved["steps"]], [1, 2])

    @patch(STREAM, side_effect=chunks("Sorry, I can't do JSON today"))
    def test_malformed_ai_output_is_not_stored(self, _stream):
        events = sse_events(self.post("/api/roadmaps/stream", self.form))
        self.assertEqual(events, [{"type": "error", "message": ai.BAD_OUTPUT}])
        self.assertFalse(Roadmap.objects.exists())

    @patch(STREAM, side_effect=chunks(AI_JSON))
    def test_non_streaming_create(self, _stream):
        response = self.post("/api/roadmaps", self.form)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["estimatedDuration"], "6 weeks")

    @patch(STREAM)
    def test_invalid_input_never_calls_ai(self, stream):
        for bad in [{"goal": ""}, {"weeklyHours": 0}, {"weeklyHours": 61}, {"level": "expert"}]:
            with self.subTest(bad=bad):
                response = self.post("/api/roadmaps/stream", {**self.form, **bad})
                self.assertEqual(response.status_code, 400)
                self.assertIn("message", response.json())
        stream.assert_not_called()
        self.assertFalse(Roadmap.objects.exists())

    @patch(STREAM, side_effect=chunks("Learn Django models, views, templates, forms and auth."))
    def test_enhance_goal(self, _stream):
        self.assertEqual(self.post("/api/roadmaps/enhance", {"goal": ""}).status_code, 400)
        response = self.post("/api/roadmaps/enhance", {"goal": "django"})
        self.assertEqual(response.json(), {"goal": "Learn Django models, views, templates, forms and auth."})

    @patch(STREAM, side_effect=chunks("Better goal"))
    def test_ai_endpoints_are_rate_limited(self, _stream):
        for _ in range(10):
            self.post("/api/roadmaps/enhance", {"goal": "django"})
        blocked = self.post("/api/roadmaps/enhance", {"goal": "django"})
        self.assertEqual(blocked.status_code, 429)
        self.assertEqual(blocked.json()["message"], "AI request limit reached — please wait a few minutes and try again")


class RoadmapAccessTests(RoadmapApiTestCase):
    def test_list_returns_only_own_roadmaps_in_original_shape(self):
        mine = self.make_roadmap(goal="Mine")
        self.make_roadmap(user=User.objects.create_user("other@example.com"), goal="Theirs")
        data = self.client.get("/api/roadmaps").json()
        self.assertEqual([r["goal"] for r in data], ["Mine"])
        self.assertEqual(set(data[0]), {"_id", "user", "goal", "level", "weeklyHours", "estimatedDuration", "steps", "createdAt", "updatedAt"})
        self.assertEqual(data[0]["steps"][0], {
            "_id": str(mine.steps.get(number=1).pk), "stepNumber": 1, "title": "Step 1", "description": "",
            "duration": "", "resources": [], "completed": False, "completedAt": None,
        })

    def test_anonymous_requests_get_401(self):
        self.client.logout()
        for method, url in [("get", "/api/roadmaps"), ("post", "/api/roadmaps/stream"), ("patch", "/api/roadmaps/1/steps/1")]:
            response = getattr(self.client, method)(url)
            self.assertEqual((response.status_code, response.json()), (401, {"message": "Not authorized, no token"}))

    def test_other_users_roadmaps_are_forbidden(self):
        theirs = self.make_roadmap(user=User.objects.create_user("other@example.com"))
        step = theirs.steps.first()
        toggle = self.client.patch(f"/api/roadmaps/{theirs.pk}/steps/{step.pk}")
        self.assertEqual((toggle.status_code, toggle.json()), (403, {"message": "Not authorized to modify this roadmap"}))
        explain = self.post(f"/api/roadmaps/{theirs.pk}/steps/{step.pk}/explain")
        self.assertEqual(explain.status_code, 403)
        self.assertIsNone(Step.objects.get(pk=step.pk).completed_at)

    def test_toggle_step(self):
        roadmap = self.make_roadmap()
        step = roadmap.steps.get(number=1)
        url = f"/api/roadmaps/{roadmap.pk}/steps/{step.pk}"
        done = self.client.patch(url).json()["steps"][0]
        self.assertTrue(done["completed"])
        self.assertIsNotNone(done["completedAt"])
        undone = self.client.patch(url).json()["steps"][0]
        self.assertEqual((undone["completed"], undone["completedAt"]), (False, None))
        self.assertEqual(self.client.patch(f"/api/roadmaps/999/steps/{step.pk}").json(), {"message": "Roadmap not found"})
        self.assertEqual(self.client.patch(f"/api/roadmaps/{roadmap.pk}/steps/999").json(), {"message": "Step not found"})

    @patch(STREAM, side_effect=chunks("## What it really is\nA **thing**.", size=8))
    def test_mentor_streams_explanation(self, stream):
        roadmap = self.make_roadmap()
        step = roadmap.steps.first()
        events = sse_events(self.post(f"/api/roadmaps/{roadmap.pk}/steps/{step.pk}/explain", {"mode": "bogus"}))
        self.assertEqual(events[-1], {"type": "done"})
        self.assertEqual("".join(e["text"] for e in events[:-1]), "## What it really is\nA **thing**.")
        self.assertIn("## What it really is", stream.call_args.args[0])  # unknown mode falls back to "explain"

    @patch(STREAM, side_effect=ai.AIError("AI service is not configured"))
    def test_mentor_errors_travel_in_the_stream(self, _stream):
        roadmap = self.make_roadmap()
        events = sse_events(self.post(f"/api/roadmaps/{roadmap.pk}/steps/{roadmap.steps.first().pk}/explain"))
        self.assertEqual(events, [{"type": "error", "message": "AI service is not configured"}])


class ModelConstraintTests(RoadmapApiTestCase):
    def test_step_numbers_are_unique_per_roadmap(self):
        roadmap = self.make_roadmap(steps=1)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Step.objects.create(roadmap=roadmap, number=1, title="Duplicate")

    def test_database_rejects_out_of_range_hours_and_unknown_levels(self):
        for bad in [{"weekly_hours": 500}, {"level": "wizard"}]:
            fields = {"user": self.user, "goal": "x", "level": "beginner", "weekly_hours": 5, **bad}
            with self.subTest(bad=bad), self.assertRaises(IntegrityError), transaction.atomic():
                Roadmap.objects.create(**fields)


class PagesTests(TestCase):
    """Server-rendered /manage pages: template inheritance, CRUD with forms, reports, ownership."""

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("owner@example.com", password="pw-owner-123")
        self.client.force_login(self.user)
        self.mine = Roadmap.objects.create(user=self.user, goal="Django", level="beginner", weekly_hours=5)
        Step.objects.create(roadmap=self.mine, number=1, title="Models", completed_at=timezone.now())
        Step.objects.create(roadmap=self.mine, number=2, title="Views")
        other = User.objects.create_user("other@example.com", password="pw-other-123")
        self.theirs = Roadmap.objects.create(user=other, goal="Secret plan", level="advanced", weekly_hours=3)

    def test_report_shows_only_my_roadmaps_with_progress_and_filters(self):
        response = self.client.get("/manage")
        self.assertTemplateUsed(response, "base.html")  # roadmap_list.html extends it
        self.assertContains(response, ">Django<")
        self.assertNotContains(response, "Secret plan")
        self.assertContains(response, "1 / 2")
        self.assertContains(response, "50%")
        self.assertNotContains(self.client.get("/manage?q=flask"), ">Django<")
        self.assertNotContains(self.client.get("/manage?level=advanced"), ">Django<")

    @patch("roadmaps.ai.generate_roadmap", return_value=ai.parse_roadmap(AI_JSON))
    def test_create_update_delete(self, _):
        response = self.client.post("/manage/new", {"goal": "Flask", "level": "intermediate", "weekly_hours": 4})
        created = Roadmap.objects.get(goal="Flask")
        self.assertRedirects(response, f"/manage/{created.pk}")
        self.assertEqual(created.steps.count(), 2)

        self.client.post(f"/manage/{created.pk}/edit", {"goal": "Flask APIs", "level": "advanced", "weekly_hours": 6})
        created.refresh_from_db()
        self.assertEqual((created.goal, created.level, created.weekly_hours), ("Flask APIs", "advanced", 6))

        self.assertRedirects(self.client.post(f"/manage/{created.pk}/delete"), "/manage")
        self.assertFalse(Roadmap.objects.filter(pk=created.pk).exists())
        self.assertFalse(Step.objects.filter(roadmap_id=created.pk).exists())

    def test_invalid_form_is_shown_again_with_errors(self):
        response = self.client.post("/manage/new", {"goal": "Flask", "level": "wizard", "weekly_hours": 500})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "errorlist")
        self.assertFalse(Roadmap.objects.filter(goal="Flask").exists())

    def test_other_users_roadmaps_are_404_and_anonymous_users_go_to_login(self):
        for url in [f"/manage/{self.theirs.pk}", f"/manage/{self.theirs.pk}/edit", f"/manage/{self.theirs.pk}/delete"]:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.post(f"/manage/{self.theirs.pk}/delete").status_code, 404)
        self.assertTrue(Roadmap.objects.filter(pk=self.theirs.pk).exists())
        self.client.logout()
        self.assertRedirects(self.client.get("/manage"), "/login?next=/manage", fetch_redirect_response=False)

    def test_csv_export(self):
        rows = self.client.get("/manage/report.csv").content.decode().splitlines()
        self.assertEqual(rows[0].split(",")[:2], ["Goal", "Level"])
        self.assertEqual(len(rows), 2)  # header + my one roadmap, not the other user's
        self.assertEqual(rows[1].split(",")[4:7], ["2", "1", "50"])
