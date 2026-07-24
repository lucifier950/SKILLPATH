import express from 'express'
import { registerUser,loginUser, logoutUser, getMe, googleAuth } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiters.js';
const router = express.Router();
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.post('/logout',logoutUser);
router.get('/me',protect,getMe);
export default router