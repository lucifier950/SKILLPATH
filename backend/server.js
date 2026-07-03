// const express = require('express')
import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
dotenv.config();
await connectDB();
const app = express()
const PORT = process.env.PORT
app.use(express.json());
app.get('/api/health', (req,res)=>{
    res.json({
        status: 'ok',
        message: "skill path api is running"
    })
})
app.listen(PORT,()=> console.log(`Server running on Port : ${PORT}`))
