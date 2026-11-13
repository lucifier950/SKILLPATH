"""Auth API — port of backend/controllers/authController.js, with Django sessions instead of a JWT cookie."""

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from skillpath.api import ApiError, api_view, first_error
from skillpath.ratelimit import auth_limit

from .forms import RegisterForm


def user_json(user):
    return {"_id": str(user.pk), "name": user.first_name, "email": user.email, "role": "admin" if user.is_staff else "user"}


@api_view("POST")
@auth_limit
def register(request):
    data = request.data
    if not all(data.get(field) for field in ("name", "email", "password")):
        raise ApiError(400, "Please fill all the fields")
    form = RegisterForm(data)
    if not form.is_valid():
        raise ApiError(400, first_error(form))
    user = form.save()
    login(request, user)
    return JsonResponse(user_json(user), status=201)


@api_view("POST")
@auth_limit
def login_view(request):
    email = str(request.data.get("email") or "").strip().lower()
    password = str(request.data.get("password") or "")
    if not email or not password:
        raise ApiError(400, "Please fill all the fields")
    user = authenticate(request, username=email, password=password)
    if user is None:
        raise ApiError(401, "Invalid email or password")
    login(request, user)
    return JsonResponse(user_json(user))


@api_view("POST")
@auth_limit
def google_login(request):
    credential = request.data.get("credential")
    if not credential:
        raise ApiError(400, "Missing Google credential")
    if not settings.GOOGLE_CLIENT_ID:
        raise ApiError(500, "Google sign-in is not configured")
    try:
        info = id_token.verify_oauth2_token(credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
    except (ValueError, GoogleAuthError):
        raise ApiError(401, "Invalid Google credential")
    if not info.get("email_verified"):
        raise ApiError(401, "Google account email is not verified")

    email = info["email"].lower()
    user, created = User.objects.get_or_create(
        username=email, defaults={"email": email, "first_name": (info.get("name") or email.split("@")[0])[:150]}
    )
    if created:
        user.set_unusable_password()  # Google-only account: password login stays disabled
        user.save(update_fields=["password"])
    login(request, user)
    return JsonResponse(user_json(user))


@api_view("POST")
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully"})


@api_view("GET", login_required=True)
def me(request):
    return JsonResponse(user_json(request.user))
