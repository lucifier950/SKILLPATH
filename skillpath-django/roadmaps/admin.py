from django.contrib import admin

from .models import Roadmap, Step


class StepInline(admin.TabularInline):
    model = Step
    extra = 0


@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = ["goal", "user", "level", "weekly_hours", "created_at"]
    list_filter = ["level"]
    search_fields = ["goal", "user__username"]
    inlines = [StepInline]
