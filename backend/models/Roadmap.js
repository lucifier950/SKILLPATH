import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        goal: { type: String, required: true },
        level: { type: String, required: true },
        weeklyHours: { type: Number, required: true },
        estimatedDuration: { type: String },
        steps: [
            {
                stepNumber: Number,
                title: String,
                description: String,
                duration: String,
                resources: [String],
                completed: { type: Boolean, default: false },
            },
        ],
    },
    { timestamps: true }
);

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;