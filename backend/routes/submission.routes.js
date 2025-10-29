// /routes/submission.routes.js

const express = require('express');
const router = express.Router({ mergeParams: true }); 
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { 
    submitWork,
    getSubmissionsByAssignment,
    getMySubmissions,
    getSubmissionById,
    gradeSubmission,
    getGradeDistribution, 
    // CRITICAL FIX 1: Import the new controller function
    getSubmissionByAssignmentId
} = require('../controllers/submission.controller');

// CRITICAL FIX 2: Define the Comment Routes for nesting under submissions
const commentRoutes = require('./comment.routes'); 
router.use('/:submissionId/comments', commentRoutes); 


// =================================================================
// 1. NESTED ROUTES (Depend on :assignmentId from parent URL)
//    Base: /api/classes/:classId/assignments/:assignmentId/submissions
// =================================================================

// POST /.../submissions (Student submits or resubmits)
router.post('/', protect, restrictTo('student'), submitWork);

// GET /.../submissions?page=... (Teacher's Submissions Queue for this assignment)
router.get('/', protect, restrictTo('teacher', 'admin'), getSubmissionsByAssignment);

// GET /.../submissions/grades/distribution (Teacher/Admin analytics for this assignment)
router.get('/grades/distribution', protect, restrictTo('teacher', 'admin'), getGradeDistribution); 


// =================================================================
// 2. GLOBAL SUBMISSIONS ROUTES (Depend on /api/submissions base)
//    Base: /api/submissions
// =================================================================

// CRITICAL FIX 3: DELETE duplicate and conflicting routes.

// GET /api/submissions/me (Student's aggregated view across ALL classes)
router.get('/me', protect, restrictTo('student'), getMySubmissions);

// GET /api/submissions/by-assignment/:assignmentId 
// (NEW: Fetches the single submission record for the logged-in student)
router.get('/by-assignment/:assignmentId', protect, getSubmissionByAssignmentId); 

// GET /api/submissions/:submissionId (Fetches a single submission by its ID)
router.get('/:submissionId', protect, getSubmissionById);

// PATCH /api/submissions/:submissionId/grade (Teacher updates grade and feedback)
router.patch('/:submissionId/grade', protect, restrictTo('teacher'), gradeSubmission);


module.exports = router;