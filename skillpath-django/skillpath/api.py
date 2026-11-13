"""JSON API plumbing shared by every endpoint, mirroring the original Express app:
JSON bodies in, JSON out, and every error as {"message": "..."} with the right status code
(backend/middleware/errorMiddleware.js)."""

import json
import logging
from functools import wraps

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


def error(status, message):
    return JsonResponse({"message": message}, status=status)


def first_error(form):
    return next(iter(form.errors.values()))[0]


def api_view(*methods, login_required=False):
    """Method check, optional login (401 like the `protect` middleware), JSON body -> request.data.

    CSRF: Django serves the React app from the same origin and the session cookie is SameSite=Lax,
    so browsers never attach it to cross-site POST/PATCH requests. That stands in for Django's
    form-token check, which a fetch()-based SPA doesn't send.
    """

    def decorator(view):
        @csrf_exempt
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            if request.method not in methods:
                return error(404, f"Not found - {request.path}")
            if login_required and not request.user.is_authenticated:
                return error(401, "Not authorized, no token")
            try:
                data = json.loads(request.body) if request.body else {}
            except ValueError:
                return error(400, "Invalid JSON body")
            request.data = data if isinstance(data, dict) else {}
            try:
                return view(request, *args, **kwargs)
            except ApiError as exc:
                return error(exc.status, exc.message)
            except Exception:
                logger.exception("Unhandled API error on %s", request.path)
                return error(500, "Something went wrong — please try again")

        return wrapped

    return decorator
