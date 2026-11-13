"""Contact API — port of backend/controllers/contactController.js."""

from django.forms import modelform_factory
from django.http import JsonResponse

from skillpath.api import ApiError, api_view, first_error

from .models import Message

MessageForm = modelform_factory(Message, fields=["name", "email", "subject", "message"])


@api_view("POST")
def create_message(request):
    if not all(request.data.get(field) for field in MessageForm.base_fields):
        raise ApiError(400, "Please fill all the fields")
    form = MessageForm(request.data)
    if not form.is_valid():
        raise ApiError(400, first_error(form))
    form.save()
    return JsonResponse({"message": "Message received — we'll get back to you soon"}, status=201)
