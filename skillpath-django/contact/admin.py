from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["subject", "name", "email", "created_at"]
    search_fields = ["subject", "name", "email", "message"]
    readonly_fields = ["created_at"]
