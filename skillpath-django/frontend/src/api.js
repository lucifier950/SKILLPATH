// Django serves this app and its API from the same origin, so API calls are relative ("/api/...").
// In `npm run dev`, Vite proxies /api to Django (see vite.config.js).
export const API_URL = import.meta.env.VITE_API_URL || "";
