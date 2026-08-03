// The Express app, with no DB connection and no .listen() — so tests can
// import it directly (supertest) while server.js wires it to the real world.
import express from 'express'
import dotenv from 'dotenv'
import router from './routes/authRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import roadmapRouter from './routes/roadmapRoutes.js';
import contactRouter from './routes/contactRoutes.js';
dotenv.config();
const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1) // Render sits behind one proxy hop; needed for real client IPs
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}))
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', router);
app.use('/api/roadmaps', roadmapRouter);
app.use('/api/contact', contactRouter);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: "skill path api is running"
    })
})
app.use(notFound);
app.use(errorHandler);

export default app;
