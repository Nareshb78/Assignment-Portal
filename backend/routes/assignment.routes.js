// /routes/assignment.routes.js

const express = require('express');
// We use mergeParams to access the :classId parameter from the parent router (class.routes.js)
const router = express.Router({ mergeParams: true }); 
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const {
    createAssignment,
    getAssignmentsByClass,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    getTeacherDashboardMetrics,
} = require('../controllers/assignment.controller');
const submissionRoutes = require('./submission.routes'); // Nested submission routes

// === Nested Submission Routes ===
// Forward requests to /api/classes/:classId/assignments/:assignmentId/submissions 
// to the submission router
router.use('/:assignmentId/submissions', submissionRoutes);

// === Core Assignment Routes ===

// POST /api/classes/:classId/assignments (Teacher only)
router.post('/', protect, restrictTo('teacher'), createAssignment);

// GET /api/classes/:classId/assignments?page=&q=&statusFilter=... (All members)
router.get('/', protect, getAssignmentsByClass);

// GET /api/classes/:classId/assignments/:assignmentId (All members)
router.get('/:assignmentId', protect, getAssignmentById);

// PATCH /api/classes/:classId/assignments/:assignmentId (Teacher only)
router.patch('/:assignmentId', protect, restrictTo('teacher'), updateAssignment);

// DELETE /api/classes/:classId/assignments/:assignmentId (Teacher or Admin)
router.delete('/:assignmentId', protect, restrictTo('teacher', 'admin'), deleteAssignment);

router.get('/metrics/teacher', protect, restrictTo('teacher'), getTeacherDashboardMetrics);

module.exports = router;