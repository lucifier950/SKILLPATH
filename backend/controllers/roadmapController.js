import Roadmap from '../models/Roadmap.js';
import { generateRoadmapWithAI } from '../services/aiService.js';

export const createRoadmap = async (req, res) => {
    const { goal, level, weeklyHours } = req.body;
    if (!goal || !level || !weeklyHours) {
        res.status(400);
        throw new Error('Please fill all the fields');
    }
    const aiData = await generateRoadmapWithAI(goal, level, weeklyHours);
    const roadmap = await Roadmap.create({
        user: req.user._id,
        goal,
        level,
        weeklyHours,
        estimatedDuration: aiData.estimatedDuration,
        steps: aiData.steps,
    });
    res.status(201).json(roadmap);
};

export const getMyRoadmaps = async (req, res) => {
    const roadmaps = await Roadmap.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(roadmaps);
};

export const toggleStep = async (req, res) => {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
        res.status(404);
        throw new Error('Roadmap not found');
    }
    if (roadmap.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to modify this roadmap');
    }
    const step = roadmap.steps.id(req.params.stepId);
    if (!step) {
        res.status(404);
        throw new Error('Step not found');
    }
    step.completed = !step.completed;
    await roadmap.save();
    res.status(200).json(roadmap);
};