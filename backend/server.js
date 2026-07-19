// const express = require('express')
import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import router from './routes/authRoutes.js';
import { errorHandler,notFound } from './middleware/errorMiddleware.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import roadmapRouter from './routes/roadmapRoutes.js';
dotenv.config();
await connectDB();
const app = express()
app.disable('x-powered-by')
const PORT = process.env.PORT
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}))
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth',router);
app.use('/api/roadmaps', roadmapRouter);
app.get('/api/health', (req,res)=>{
    res.json({
        status: 'ok',
        message: "skill path api is running"
    })
})
app.use(notFound);
app.use(errorHandler);
app.listen(PORT,()=> console.log(`Server running on Port : ${PORT}`))
