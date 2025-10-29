// /models/Assignment.model.js

const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Assignment title is required'],
        trim: true
    },
    description: {
        type: String,
        required: false
    },
    dueAt: {
        type: Date,
        required: [true, 'A due date is required']
    },
    // Allows for links to external instructions or attachments
    attachments: [{ 
        fileName: String,
        url: String,
        fileType: String,
        _id: false
    }],
    createdBy: { // The teacher who created the assignment
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    maxScore: {
        type: Number,
        default: 100
    },
    visibility: { // Future feature control
        type: String,
        enum: ['active', 'draft', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

// Compound index for efficient listing and filtering by class and deadline
AssignmentSchema.index({ classId: 1, dueAt: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);