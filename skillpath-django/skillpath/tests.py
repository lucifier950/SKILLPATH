from django.test import TestCase

from contact.models import Message


class SiteTests(TestCase):
    def post(self, url, data):
        return self.client.post(url, data, content_type="application/json")

    def test_health(self):
        self.assertEqual(self.client.get("/api/health").json(), {"status": "ok", "message": "skill path api is running"})

    def test_unknown_api_routes_and_methods_are_json_404s(self):
        self.assertEqual(self.client.get("/api/nope").json(), {"message": "Not found - /api/nope"})
        self.assertEqual(self.client.delete("/api/roadmaps").status_code, 404)

    def test_invalid_json_body(self):
        response = self.client.post("/api/contact", "{not json", content_type="application/json")
        self.assertEqual((response.status_code, response.json()), (400, {"message": "Invalid JSON body"}))

    def test_react_app_is_served_for_every_page_route(self):
        for url in ["/", "/about", "/contact", "/login", "/signup", "/roadmap", "/some/unknown/page"]:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertContains(response, '<div id="root">')
                self.assertContains(response, "/static/assets/")


class ContactTests(TestCase):
    message = {"name": "Asha", "email": "asha@example.com", "subject": "Hello", "message": "Love the app!"}

    def post(self, data):
        return self.client.post("/api/contact", data, content_type="application/json")

    def test_message_is_stored(self):
        response = self.post(self.message)
        self.assertEqual((response.status_code, response.json()), (201, {"message": "Message received — we'll get back to you soon"}))
        self.assertEqual(Message.objects.get().subject, "Hello")

    def test_validation(self):
        self.assertEqual(self.post({**self.message, "subject": ""}).json(), {"message": "Please fill all the fields"})
        self.assertEqual(self.post({**self.message, "email": "nope"}).status_code, 400)
        self.assertEqual(self.post({**self.message, "subject": "x" * 201}).status_code, 400)
        self.assertFalse(Message.objects.exists())
