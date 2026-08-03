import express from 'express';
import { createRoadmap, createRoadmapStream, getMyRoadmaps, toggleStep, explainStep, expandGoal } from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();
router.post('/', protect, aiLimiter, createRoadmap);
router.post('/stream', protect, aiLimiter, createRoadmapStream);
router.post('/enhance', protect, aiLimiter, expandGoal);
router.get('/', protect, getMyRoadmaps);
router.patch('/:id/steps/:stepId', protect, toggleStep);
router.post('/:id/steps/:stepId/explain', protect, aiLimiter, explainStep);
export default router;