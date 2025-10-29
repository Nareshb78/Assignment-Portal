// /models/Submission.model.js

const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Array to store links (GitHub, Drive) or cloud URLs for uploaded files
    linkOrFiles: [{
        type: { // Must be 'type' for the property name, but Mongoose will recognize the type
            type: String, // 'link' or 'file'
            enum: ['link', 'file'],
            required: true
        },
        url: {
            type: String, // The actual link or cloud URL
            required: true
        },
        contentType: String, // e.g., 'text/uri', 'application/pdf'
        size: Number, // In bytes
        _id: false
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['submitted', 'graded', 'missing', 'late'],
        default: 'submitted'
    },
    late: {
        type: Boolean,
        default: false
    },
    grade: {
        score: {
            type: Number,
            min: 0,
            required: false // Only required if status is 'graded'
        },
        feedback: {
            type: String,
            required: false
        },
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        gradedAt: Date
    },
    updatedBy: { // Audit field
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Compound unique index to prevent duplicate submissions by the same student for the same assignment
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

// Index for teacher's submission queue filtering
SubmissionSchema.index({ assignmentId: 1, status: 1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
