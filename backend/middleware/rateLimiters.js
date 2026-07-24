import rateLimit from 'express-rate-limit';

// AI endpoints hit Groq — the strictest budget. Runs AFTER protect, so only
// authenticated traffic counts and a 401 never burns quota.
export const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'AI request limit reached — please wait a few minutes and try again' },
});

// Auth endpoints run the limiter FIRST: it's brute-force protection,
// so failed attempts must count too.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts — please try again in a few minutes' },
});
