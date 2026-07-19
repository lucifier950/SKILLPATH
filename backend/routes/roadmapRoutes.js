import express from 'express';
import { createRoadmap, getMyRoadmaps, toggleStep } from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/', protect, createRoadmap);
router.get('/', protect, getMyRoadmaps);
router.patch('/:id/steps/:stepId', protect, toggleStep);
export default router;