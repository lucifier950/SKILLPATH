from django import forms
from django.contrib.auth import password_validation
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class RegisterForm(forms.Form):
    name = forms.CharField(max_length=150)
    email = forms.EmailField(max_length=150)
    password = forms.CharField(strip=False)

    def clean_email(self):
        email = self.cleaned_data["email"].lower()
        if User.objects.filter(username=email).exists():
            raise ValidationError("User already exists")
        return email

    def clean(self):
        cleaned = super().clean()
        password = cleaned.get("password")
        if password:
            # Django's validators: minimum length, common passwords, all-numeric, similarity to name/email.
            candidate = User(username=cleaned.get("email", ""), first_name=cleaned.get("name", ""))
            try:
                password_validation.validate_password(password, candidate)
            except ValidationError as exc:
                self.add_error("password", exc)
        return cleaned

    def save(self):
        data = self.cleaned_data
        # The email doubles as the username, so Django's built-in User model and auth backend work unchanged.
        return User.objects.create_user(
            username=data["email"], email=data["email"], password=data["password"], first_name=data["name"]
        )
