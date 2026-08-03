import Roadmap from '../models/Roadmap.js';
import { generateRoadmapWithAI, streamRoadmapEvents, streamStepExplanation, enhanceGoal } from '../services/aiService.js';

// "Expand Prompt": turn a terse goal into a specific one. Nothing is persisted —
// the enriched text just goes back into the form for the user to edit or submit.
export const expandGoal = async (req, res) => {
    const { goal } = req.body;
    if (!goal || !goal.trim()) {
        res.status(400);
        throw new Error('Please enter a goal to expand');
    }
    const expanded = await enhanceGoal(goal.trim());
    res.json({ goal: expanded });
};

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

// SSE endpoint: streams roadmap generation events, then persists and sends the saved document.
// Errors after headers are sent must go through the stream — the JSON error middleware can't help here.
export const createRoadmapStream = async (req, res) => {
    const { goal, level, weeklyHours } = req.body;
    if (!goal || !level || !weeklyHours) {
        res.status(400);
        throw new Error('Please fill all the fields');
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
    try {
        let aiData = null;
        for await (const event of streamRoadmapEvents(goal, level, weeklyHours)) {
            if (event.type === 'complete') {
                aiData = event.data;
            } else {
                send(event);
            }
        }
        const roadmap = await Roadmap.create({
            user: req.user._id,
            goal,
            level,
            weeklyHours,
            estimatedDuration: aiData.estimatedDuration,
            steps: aiData.steps,
        });
        send({ type: 'done', roadmap });
    } catch (err) {
        send({ type: 'error', message: err.message || 'Roadmap generation failed' });
    } finally {
        res.end();
    }
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
    step.completedAt = step.completed ? new Date() : null;
    await roadmap.save();
    res.status(200).json(roadmap);
};

// SSE endpoint: streams a mentor-style explanation of one step.
// Ownership checks run BEFORE headers are sent, so they still use the JSON error middleware.
export const explainStep = async (req, res) => {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
        res.status(404);
        throw new Error('Roadmap not found');
    }
    if (roadmap.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this roadmap');
    }
    const step = roadmap.steps.id(req.params.stepId);
    if (!step) {
        res.status(404);
        throw new Error('Step not found');
    }
    // mode picks the mentor lens; anything unknown falls back to the default deep dive
    const mode = ['explain', 'simplify', 'example', 'analogy'].includes(req.body?.mode)
        ? req.body.mode
        : 'explain';
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
    try {
        for await (const text of streamStepExplanation(roadmap.goal, roadmap.level, step, mode)) {
            send({ type: 'chunk', text });
        }
        send({ type: 'done' });
    } catch (err) {
        send({ type: 'error', message: err.message || 'Explanation failed' });
    } finally {
        res.end();
    }
};