import express from 'express';
import { createRoadmap, getMyRoadmaps } from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/', protect, createRoadmap);
router.get('/', protect, getMyRoadmaps);
export default router;