<div align="center">

# 🎯 SkillPath AI

### *Tell it what you want to learn. Get a personalized curriculum in seconds.*

An AI-powered learning roadmap generator — pick a goal, your level, and your weekly hours,
and watch an LLM build you a step-by-step learning path, saved to your account.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Groq](https://img.shields.io/badge/AI-Groq%20·%20Llama%203.3%2070B-F55036?style=for-the-badge)
![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20HttpOnly%20Cookies-8A2BE2?style=for-the-badge)

</div>

---

## ✨ What it does

```
  "I want to learn React"  +  "beginner"  +  "5 hours/week"
                          │
                          ▼
              🤖  llama-3.3-70b-versatile
                          │
                          ▼
   📋  7-step personalized roadmap · durations · curated resources
       saved to YOUR account, ready to track
```

## 🚀 Features

| | |
|---|---|
| 🤖 **AI Roadmap Generation** | Personalized learning paths (steps, durations, resources) generated from a 3-field form via Groq |
| 🔐 **Real Authentication** | Register · Login · Logout · Session persistence — JWT in **HttpOnly cookies**, immune to XSS token theft |
| 🛡️ **Protected API** | `protect` middleware verifies the JWT on every private request — users only ever see *their own* roadmaps |
| 🧯 **Clean Error Handling** | Custom `notFound` + `errorHandler` middleware — JSON errors only, stack traces never leak outside development |
| 🔑 **Password Security** | bcrypt hashing via Mongoose pre-save hook — plaintext never touches the database |
| 💾 **Persistence** | Roadmaps stored in MongoDB Atlas with per-step completion tracking built into the schema |

## 🏗️ Architecture

```
        React 19 (Vite · Tailwind · neumorphic UI)
                          │
              fetch + credentials:'include'
                          ▼
        ┌─────────── Express 5 API ───────────┐
        │  cors → express.json → cookieParser │
        │                                     │
        │  /api/auth      → register / login  │
        │                   logout / me  🔒   │
        │  /api/roadmaps  → 🔒 protect        │
        │        → controller → aiService     │
        │                          │          │
        │  notFound (404)          ▼          │
        │  errorHandler        🤖 Groq        │
        └──────────────┬──────────────────────┘
                       ▼
               🍃 MongoDB Atlas
```

**Roadmap request journey:** browser cookie → `protect` verifies JWT & attaches `req.user` → controller validates input → `aiService` prompts the LLM for strict JSON → output validated & parsed → saved to Atlas stamped with the owner's id → rendered by React.

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|:------:|----------|:----:|-------------|
| `POST` | `/api/auth/register` | — | Create account, sets JWT cookie |
| `POST` | `/api/auth/login` | — | Login, sets JWT cookie |
| `POST` | `/api/auth/logout` | — | Clears the JWT cookie |
| `GET` | `/api/auth/me` | 🔒 | Current user's profile |
| `POST` | `/api/roadmaps` | 🔒 | Generate & save an AI roadmap |
| `GET` | `/api/roadmaps` | 🔒 | List the logged-in user's roadmaps |
| `GET` | `/api/health` | — | Health check |

## 🛠️ Running Locally

> **Prerequisites:** Node 18+ · MongoDB Atlas cluster · free [Groq API key](https://console.groq.com)

**1️⃣ Backend**

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=a_long_random_string
NODE_ENV=development
GROQ_API_KEY=gsk_your_groq_key
# CLIENT_URL is set ONLY in production (flips cookies to secure/cross-site mode)
```

```bash
node server.js
# ✅ MongoDB connected · Server running on Port : 5001
```

**2️⃣ Frontend**

```bash
cd frontend/vite-project
npm install
npm run dev
# → http://localhost:5173
```

The frontend reads `VITE_API_URL` (defaults to `http://localhost:5001` for local dev).

## ☁️ Deployment

| Piece | Platform | Config |
|-------|----------|--------|
| Backend | **Render** | root `backend` · start `node server.js` · env: `MONGO_URI` `JWT_SECRET` `GROQ_API_KEY` `NODE_ENV=production` `CLIENT_URL=<frontend URL>` |
| Frontend | **Vercel** | root `frontend/vite-project` · env: `VITE_API_URL=<backend URL>` |
| Database | **MongoDB Atlas** | already cloud-hosted ✅ |

> Setting `CLIENT_URL` automatically switches cookies to `secure` + `SameSite=None` for cross-site auth between the two domains.

## 🔒 Security Highlights

- 🍪 JWT lives in an **HttpOnly** cookie — invisible to JavaScript, XSS-proof session storage
- 🙈 Stack traces stripped from all error responses outside development
- 🤐 `X-Powered-By` header disabled — the server doesn't advertise its stack
- 🧂 Passwords bcrypt-hashed before storage; API responses never include the hash
- 🧪 AI output treated as **untrusted input** — parsed and structure-validated before it touches the database

---

<div align="center">

*Built as an internship project — MERN stack + Groq AI*

</div>
