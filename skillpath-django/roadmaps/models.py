from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.urls import reverse

MIN_HOURS, MAX_HOURS = 1, 60


class Level(models.TextChoices):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Roadmap(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="roadmaps")
    goal = models.CharField(max_length=200)
    level = models.CharField(max_length=20, choices=Level.choices)
    weekly_hours = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(MIN_HOURS), MaxValueValidator(MAX_HOURS)]
    )
    estimated_duration = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=Q(weekly_hours__gte=MIN_HOURS, weekly_hours__lte=MAX_HOURS), name="weekly_hours_in_range"
            ),
            models.CheckConstraint(condition=Q(level__in=Level.values), name="level_is_valid"),
        ]

    def __str__(self):
        return self.goal

    def get_absolute_url(self):
        return reverse("roadmap_detail", args=[self.pk])


class Step(models.Model):
    roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name="steps")
    number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration = models.CharField(max_length=50, blank=True)
    resources = models.JSONField(default=list, blank=True)
    # Null = not done. The timestamp is the single source of truth for progress, streaks and activity.
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["number"]
        constraints = [models.UniqueConstraint(fields=["roadmap", "number"], name="unique_step_number_per_roadmap")]

    def __str__(self):
        return f"{self.number}. {self.title}"

    @property
    def completed(self):
        return self.completed_at is not None
