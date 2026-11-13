from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings

PASSWORD = "learn-django-2026"


class ApiTestCase(TestCase):
    def setUp(self):
        cache.clear()  # rate-limit counters live in the cache

    def post(self, url, data=None):
        return self.client.post(url, data or {}, content_type="application/json")


class AuthTests(ApiTestCase):
    def register(self, **overrides):
        return self.post("/api/auth/register", {"name": "Asha Rao", "email": "Asha@Example.com", "password": PASSWORD, **overrides})

    def test_register_hashes_password_and_starts_session(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="asha@example.com")
        self.assertEqual(response.json(), {"_id": str(user.pk), "name": "Asha Rao", "email": "asha@example.com", "role": "user"})
        self.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        self.assertTrue(user.check_password(PASSWORD))
        self.assertEqual(self.client.get("/api/auth/me").json()["email"], "asha@example.com")

    def test_register_validation(self):
        self.register()
        self.client.post("/api/auth/logout")
        cases = [
            ({"email": "asha@example.com"}, "User already exists"),
            ({"name": ""}, "Please fill all the fields"),
            ({"email": "not-an-email"}, "Enter a valid email address."),
            ({"email": "new@example.com", "password": "12345"}, "too short"),
        ]
        for overrides, message in cases:
            with self.subTest(overrides=overrides):
                response = self.register(**overrides)
                self.assertEqual(response.status_code, 400)
                self.assertIn(message, response.json()["message"])
        self.assertEqual(User.objects.count(), 1)

    def test_login_me_logout(self):
        User.objects.create_user("asha@example.com", "asha@example.com", PASSWORD, first_name="Asha")
        bad = self.post("/api/auth/login", {"email": "asha@example.com", "password": "wrong"})
        self.assertEqual((bad.status_code, bad.json()), (401, {"message": "Invalid email or password"}))
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

        good = self.post("/api/auth/login", {"email": "ASHA@example.com", "password": PASSWORD})
        self.assertEqual((good.status_code, good.json()["name"]), (200, "Asha"))
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

        self.assertEqual(self.post("/api/auth/logout").json(), {"message": "Logged out successfully"})
        me = self.client.get("/api/auth/me")
        self.assertEqual((me.status_code, me.json()), (401, {"message": "Not authorized, no token"}))

    def test_auth_endpoints_are_rate_limited(self):
        attempt = {"email": "x@example.com", "password": "nope"}
        for _ in range(20):
            self.assertEqual(self.post("/api/auth/login", attempt).status_code, 401)
        blocked = self.post("/api/auth/login", attempt)
        self.assertEqual(blocked.status_code, 429)
        self.assertEqual(blocked.json(), {"message": "Too many attempts — please try again in a few minutes"})


VERIFY = "accounts.views.id_token.verify_oauth2_token"


@override_settings(GOOGLE_CLIENT_ID="test-client-id")
class GoogleSignInTests(ApiTestCase):
    def google(self, credential="google-id-token"):
        return self.post("/api/auth/google", {"credential": credential})

    @patch(VERIFY, return_value={"email": "Ravi@gmail.com", "email_verified": True, "name": "Ravi Kumar"})
    def test_verified_google_user_is_created_and_logged_in(self, verify):
        response = self.google()
        user = User.objects.get(username="ravi@gmail.com")
        self.assertEqual(response.json(), {"_id": str(user.pk), "name": "Ravi Kumar", "email": "ravi@gmail.com", "role": "user"})
        self.assertFalse(user.has_usable_password())
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)
        self.assertEqual(verify.call_args.args[2], "test-client-id")  # audience is checked

    @patch(VERIFY, side_effect=ValueError("Token expired"))
    def test_invalid_token_is_rejected(self, _verify):
        self.assertEqual(self.google().json(), {"message": "Invalid Google credential"})
        self.assertFalse(User.objects.exists())

    @patch(VERIFY, return_value={"email": "ravi@gmail.com", "email_verified": False})
    def test_unverified_email_is_rejected(self, _verify):
        self.assertEqual(self.google().status_code, 401)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_missing_credential_is_rejected(self):
        self.assertEqual(self.google(credential="").status_code, 400)
