import express from 'express';
import { createRoadmap, createRoadmapStream, getMyRoadmaps, toggleStep, explainStep } from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/', protect, createRoadmap);
router.post('/stream', protect, createRoadmapStream);
router.get('/', protect, getMyRoadmaps);
router.patch('/:id/steps/:stepId', protect, toggleStep);
router.post('/:id/steps/:stepId/explain', protect, explainStep);
export default router;