from django.conf import settings
from django.http import HttpResponse, JsonResponse

INDEX_HTML = settings.BASE_DIR / "frontend_build" / "index.html"


def health(request):
    return JsonResponse({"status": "ok", "message": "skill path api is running"})


def api_not_found(request):
    return JsonResponse({"message": f"Not found - {request.path}"}, status=404)


def spa(request):
    """Every non-API URL returns the React app's index.html; React Router renders the right page."""
    try:
        return HttpResponse(INDEX_HTML.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return HttpResponse(
            "Frontend not built yet: run `npm install && npm run build` in frontend/.",
            status=503,
            content_type="text/plain; charset=utf-8",
        )
