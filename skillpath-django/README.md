# SkillPath AI (Django)

An AI-powered personalised learning-roadmap generator. A user enters a learning goal, their level and weekly
study hours; **GPT-OSS 120B on Groq** (free tier) streams back a step-by-step roadmap that is validated, saved against
the user, and tracked through completion with XP, levels, streaks and an AI mentor for every step.

This is the original SkillPath (React + Express + MongoDB, kept unchanged in `../backend` and `../frontend`)
rebuilt on **Django**: the same React interface, served by Django, talking to a Django API that reproduces
every Express endpoint, response shape and streaming event.

## Lab plan coverage

| Lab topic | Where it is in this project |
|---|---|
| Python and Django fundamentals | Project `skillpath/` with three apps (`accounts`, `roadmaps`, `contact`), `settings.py`, URL routing in `skillpath/urls.py`, function views and class-based views |
| Website development and template inheritance | `templates/base.html` holds the shared layout (`{% block title %}`, `{% block content %}`, nav, flash messages, `{% static %}`). Every page in `roadmaps/templates/roadmaps/` does `{% extends "base.html" %}`. These are the server-rendered pages under `/manage` |
| Database applications using the Django ORM | `roadmaps/models.py`: `Roadmap` → `Step` (ForeignKey, `related_name`), `TextChoices`, validators, `CheckConstraint` / `UniqueConstraint`, migrations, `transaction.atomic` + `bulk_create`, `prefetch_related` / `select_related` |
| CRUD operations and forms | `/manage` pages in `roadmaps/pages.py`, built on Django generic views: **C**reate (`CreateView`, which generates steps with the AI), **R**ead (`ListView` / `DetailView`), **U**pdate (`UpdateView`), **D**elete (`DeleteView` with a confirmation page). They use a `ModelForm`, `{% csrf_token %}` and server-side validation errors. `accounts/forms.py` is the registration form |
| Authentication and administration | `django.contrib.auth` (hashed passwords, `login` / `logout`, sessions), `LoginRequiredMixin` / `@login_required`, Google Sign-In, per-user ownership checks (403/404). Django admin at `/admin/` with `RoadmapAdmin` + `StepInline`, filters and search |
| Reporting and data retrieval | `/manage` report: totals with `aggregate(Count)`, per-roadmap progress with `annotate(Count(..., filter=Q(...)))`, level breakdown with `values().annotate()`, recently completed steps, search (`icontains`) and level filter, plus a **CSV export** at `/manage/report.csv` |
| Interactive web applications | The React app (`frontend/`) talks to the Django JSON API, with live roadmap generation and AI mentor answers streamed over Server-Sent Events, step toggling, XP/levels and a ⌘K command palette |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · Tailwind CSS · Motion (the original UI, in `frontend/`) |
| Backend | Python · Django 6 (URL routing, views, forms, ORM, sessions, admin) |
| Database | SQLite via the Django ORM (swap `DATABASES` for PostgreSQL in production) |
| AI | Groq API (free tier) · `openai/gpt-oss-120b` · Server-Sent Events streaming |
| Auth | Django session cookies (HttpOnly) · Google Sign-In (ID token verified server-side) |

## How Django replaces the original backend

| Original (Express) | Django |
|---|---|
| `routes/*.js` | `skillpath/urls.py` (same paths) |
| `controllers/authController.js` | `accounts/views.py` |
| `controllers/roadmapController.js` | `roadmaps/views.py` |
| `controllers/contactController.js` | `contact/views.py` |
| `services/aiService.js` (Groq) | `roadmaps/ai.py` (same prompts; Groq retired Llama 3.3, so the model is GPT-OSS 120B) |
| `models/*.js` (Mongoose) | `roadmaps/models.py`, `contact/models.py`, Django's `User` |
| JWT cookie + `protect` middleware | Django sessions + `api_view(login_required=True)` in `skillpath/api.py` |
| `errorMiddleware.js` (`{message}` errors) | `skillpath/api.py` |
| `rateLimiters.js` | `skillpath/ratelimit.py` |
| Vercel hosting the React build | `skillpath/views.py: spa` serves `frontend_build/index.html` |

### API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` · `/api/auth/google` · `/api/auth/logout` | Account and session |
| GET | `/api/auth/me` | Current user |
| GET / POST | `/api/roadmaps` | List my roadmaps / generate one |
| POST | `/api/roadmaps/stream` | Generate with live SSE events: `meta` → `step`… → `done` |
| POST | `/api/roadmaps/enhance` | "✨ Expand" a short goal into a specific one |
| PATCH | `/api/roadmaps/<id>/steps/<stepId>` | Toggle a step complete |
| POST | `/api/roadmaps/<id>/steps/<stepId>/explain` | AI mentor (explain / simplify / example / analogy), streamed |
| POST | `/api/contact` | Contact form |
| GET | `/api/health` | Health check |

Security: passwords hashed by Django (PBKDF2), every roadmap query checked against its owner (403 otherwise),
rate limits (auth 20 and AI 10 requests per 15 minutes), AI output validated before it's saved, and
user-safe error messages. CSRF protection for the JSON API comes from the SameSite=Lax session cookie on a
same-origin app (see `skillpath/api.py`).

## Run it

Requires Python 3.12+. Node.js is only needed if you change the React code.

```bash
cd skillpath-django
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # add your GROQ_API_KEY (and GOOGLE_CLIENT_ID)
python manage.py migrate
python manage.py createsuperuser   # optional, for /admin/
python manage.py runserver
```

Open http://127.0.0.1:8000. The built React app is already in `frontend_build/`.

### Changing the frontend

```bash
cd frontend
npm install
npm run build      # writes ../frontend_build, which Django serves
npm run dev        # or: hot reload on http://localhost:5173, with /api proxied to runserver on :8000
```

The `/manage` Django templates use the React app's own stylesheet (`assets/index.css`: the same soft-UI classes,
colours, Inter font and dark mode). Tailwind also scans `templates/` and `roadmaps/templates/`, so run
`npm run build` again after adding new Tailwind classes to a template.

## Tests

```bash
python manage.py test
```

38 tests, using Django's test framework. Groq and Google are mocked, so no keys are needed. They cover:

- **Unit:** AI JSON parsing and validation, partial-JSON step streaming, database constraints, the Groq request and stream parsing
- **Authentication:** register, password hashing, login, `/me`, logout, Google Sign-In (valid / invalid / unverified)
- **Authorization:** only your own roadmaps are listed; toggling or explaining someone else's gives 403; anonymous requests get 401
- **Roadmap generation:** SSE events in order, roadmap saved; malformed AI output is rejected and nothing is stored
- **Security / API:** rate limits on auth and AI, JSON error format, invalid JSON, unknown routes, contact validation, SPA routing
- **`/manage` pages:** template inheritance, create / update / delete through forms, form errors re-shown, report totals and filters, CSV export, other users' roadmaps are 404, anonymous users are sent to login

## Project structure

```
skillpath-django/
├── manage.py, requirements.txt, .env.example
├── skillpath/        settings, urls (API table + SPA catch-all), api.py, ratelimit.py, views.py
├── accounts/         auth API (register, login, Google, logout, me)
├── templates/        base.html (shared layout for the server-rendered pages)
├── roadmaps/         Roadmap/Step models, roadmap API, Groq service (ai.py), admin,
│                     pages.py + templates/roadmaps/ (the /manage CRUD and report pages)
├── contact/          contact-form model, API, admin
├── frontend/         React source (the original UI)
└── frontend_build/   production build served by Django
```

## Production notes

- Set `DJANGO_DEBUG=false`, a random `DJANGO_SECRET_KEY`, and your domain in `DJANGO_ALLOWED_HOSTS` / `DJANGO_CSRF_TRUSTED_ORIGINS`.
- Run `python manage.py collectstatic`; WhiteNoise then serves the React build.
- The rate limiter uses Django's cache. With several worker processes, configure a shared cache (Redis),
  and behind a reverse proxy key anonymous users on the real client IP.
