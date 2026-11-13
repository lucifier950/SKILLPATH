"""Routes. The /api/* table is a one-to-one port of the Express routers in backend/routes/*.js."""

from django.contrib import admin
from django.urls import path, re_path

from accounts import views as auth
from contact import views as contact
from roadmaps import pages
from roadmaps import views as roadmaps

from . import views

urlpatterns = [
    path("api/health", views.health),
    # backend/routes/authRoutes.js
    path("api/auth/register", auth.register),
    path("api/auth/login", auth.login_view),
    path("api/auth/google", auth.google_login),
    path("api/auth/logout", auth.logout_view),
    path("api/auth/me", auth.me),
    # backend/routes/roadmapRoutes.js
    path("api/roadmaps", roadmaps.roadmaps),  # GET list, POST create
    path("api/roadmaps/stream", roadmaps.create_stream),
    path("api/roadmaps/enhance", roadmaps.enhance),
    path("api/roadmaps/<int:pk>/steps/<int:step_id>", roadmaps.toggle_step),
    path("api/roadmaps/<int:pk>/steps/<int:step_id>/explain", roadmaps.explain_step),
    # backend/routes/contactRoutes.js
    path("api/contact", contact.create_message),
    re_path(r"^api/", views.api_not_found),
    path("admin/", admin.site.urls),
    # Server-rendered pages (Django templates + forms): roadmap CRUD and progress reports
    path("manage", pages.RoadmapList.as_view(), name="roadmap_list"),
    path("manage/new", pages.RoadmapCreate.as_view(), name="roadmap_create"),
    path("manage/<int:pk>", pages.RoadmapDetail.as_view(), name="roadmap_detail"),
    path("manage/<int:pk>/edit", pages.RoadmapUpdate.as_view(), name="roadmap_update"),
    path("manage/<int:pk>/delete", pages.RoadmapDelete.as_view(), name="roadmap_delete"),
    path("manage/report.csv", pages.export_csv, name="roadmap_report_csv"),
    # Everything else is the React app; React Router handles /, /about, /roadmap, 404s, ...
    re_path(r"^(?!static/).*$", views.spa),
]
