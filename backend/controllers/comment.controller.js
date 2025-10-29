// /controllers/comment.controller.js (FINAL CODE)

const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment.model');
const Submission = require('../models/Submission.model');
const mongoose = require('mongoose');

// Helper to check if user is allowed to access the underlying submission
const canAccessSubmission = async (userId, submissionId) => {
    // Check if the submission exists and fetch its assignment ID
    const submission = await Submission.findById(submissionId).select('studentId assignmentId');
    if (!submission) return false;

    // Check if the user is the student (owner)
    const isStudentOwner = submission.studentId.toString() === userId.toString();
    if (isStudentOwner) return true;

    // Check if the user is the class teacher or admin
    if (userId && mongoose.Types.ObjectId.isValid(submission.assignmentId)) {
        const Assignment = mongoose.model('Assignment');
        const assignment = await Assignment.findById(submission.assignmentId).select('classId').populate('classId', 'teacherId');
        
        if (assignment && assignment.classId) {
            return assignment.classId.teacherId.toString() === userId.toString();
        }
    }
    
    // Admin access is handled by middleware (we only need to check student/teacher here)
    return false;
};


/**
 * @desc    Get all comments for a specific submission (Threaded)
 * @route   GET /api/submissions/:submissionId/comments
 * @access  Private/Owner, Teacher, Admin
 */
const getSubmissionComments = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const userRole = req.user.role;

    // Authorization check: Ensure user can access the underlying submission
    if (userRole !== 'admin' && !(await canAccessSubmission(req.user._id, submissionId))) {
        res.status(403);
        throw new Error('Forbidden: Cannot access comments for this submission.');
    }

    const comments = await Comment.find({ submissionId })
        .populate('authorId', 'name role') // Populate author details
        .sort({ createdAt: 1 }); // Display chronologically

    res.status(200).json({
        status: 'success',
        comments
    });
});

/**
 * @desc    Add a new comment to a submission
 * @route   POST /api/submissions/:submissionId/comments
 * @access  Private/Owner, Teacher, Admin
 */
const postNewComment = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { text, parentId } = req.body;
    const userRole = req.user.role;
    
    // Authorization check
    if (userRole !== 'admin' && !(await canAccessSubmission(req.user._id, submissionId))) {
        res.status(403);
        throw new Error('Forbidden: Cannot post comments on this submission.');
    }

    if (!text) {
        res.status(400);
        throw new Error('Comment text is required.');
    }

    const newComment = await Comment.create({
        submissionId,
        authorId: req.user._id,
        text,
        parentId: parentId || null
    });

    // Populate the author for the immediate response
    const populatedComment = await Comment.findById(newComment._id).populate('authorId', 'name role');

    res.status(201).json({
        status: 'success',
        comment: populatedComment
    });
});

module.exports = {
    getSubmissionComments,
    postNewComment
};