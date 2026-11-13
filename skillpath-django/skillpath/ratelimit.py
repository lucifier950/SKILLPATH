"""Fixed-window rate limiting on Django's cache (POST requests only), mirroring backend/middleware/rateLimiters.js.

ponytail: keyed on REMOTE_ADDR for anonymous users; behind a proxy (Render, Nginx) every
client shares one IP — read X-Forwarded-For from a trusted proxy before deploying there.
The default local-memory cache is per-process; use Redis/Memcached with multiple workers.
"""

from functools import wraps

from django.core.cache import cache
from django.http import JsonResponse

WINDOW_SECONDS = 15 * 60


def ratelimit(scope, limit, message, window=WINDOW_SECONDS):
    def decorator(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            if request.method == "POST":
                who = request.user.pk if request.user.is_authenticated else request.META.get("REMOTE_ADDR")
                key = f"ratelimit:{scope}:{who}"
                cache.add(key, 0, window)  # no-op if the window is already open
                try:
                    count = cache.incr(key)
                except ValueError:  # key expired between add() and incr()
                    cache.set(key, 1, window)
                    count = 1
                if count > limit:
                    return JsonResponse({"message": message}, status=429)
            return view(request, *args, **kwargs)

        return wrapped

    return decorator


# Auth runs the limiter before anything else (brute-force protection: failed attempts count too).
auth_limit = ratelimit("auth", 20, "Too many attempts — please try again in a few minutes")
# AI endpoints sit behind login, so only authenticated traffic counts. Every hit uses the Groq free-tier quota.
ai_limit = ratelimit("ai", 10, "AI request limit reached — please wait a few minutes and try again")
