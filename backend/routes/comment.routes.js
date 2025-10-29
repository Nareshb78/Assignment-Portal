// /routes/comment.routes.js (CREATE THIS NEW FILE)

const express = require('express');
const router = express.Router({ mergeParams: true }); 
const { protect } = require('../middleware/auth.middleware');
const { 
    getSubmissionComments, 
    postNewComment 
} = require('../controllers/comment.controller'); // Assumes controller is correctly defined

// GET /api/submissions/:submissionId/comments
router.get('/', protect, getSubmissionComments);

// POST /api/submissions/:submissionId/comments
// Allows Student (owner) and Teacher/Admin to post comments
router.post('/', protect, postNewComment);

module.exports = router;