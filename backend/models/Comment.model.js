// /models/Comment.model.js

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    submissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: [true, 'Comment text cannot be empty'],
        maxlength: 500
    },
    // For threaded comments
    parentId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        required: false
    }
}, { timestamps: true });

// Index for efficient retrieval of all comments for a submission
CommentSchema.index({ submissionId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', CommentSchema);