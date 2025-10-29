// /routes/class.routes.js (FIXED)

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { 
    createClass,
    getClasses,
    getClassById,
    enrollStudent,
    removeMember,
    updateClass,
    deleteClass
} = require('../controllers/class.controller');
const assignmentRoutes = require('./assignment.routes');

// === Nested Assignment Routes ===
router.use('/:classId/assignments', assignmentRoutes);

// === Core Class Routes ===

// POST /api/classes (Teacher or Admin can create)
router.post('/', protect, restrictTo('teacher', 'admin'), createClass);

// CRITICAL FIX: Explicitly restrict to ALL members (student, teacher, admin)
// GET /api/classes?mine=1&page=... (All roles can list classes they are members of)
router.get('/', protect, restrictTo('student', 'teacher', 'admin'), getClasses); 

// GET /api/classes/:id (All members can view class details)
// Note: This route requires the controller to perform an additional membership check, 
// but we add the roles here for base access.
router.get('/:classId', protect, restrictTo('student', 'teacher', 'admin'), getClassById);

// PATCH /api/classes/:classId (Teacher or Admin can update class)
router.patch('/:classId', protect, restrictTo('teacher', 'admin'), updateClass);

// DELETE /api/classes/:classId (Admin only)
router.delete('/:classId', protect, restrictTo('admin'), deleteClass);

// === Membership Routes ===

// POST /api/classes/:classId/enroll (Allows Student self-enrollment)
router.post('/:classId/enroll', protect, restrictTo('student', 'teacher', 'admin'), enrollStudent);

// DELETE /api/classes/:classId/members/:userId (Admin or Teacher removes a student)
router.delete('/:classId/members/:userId', protect, restrictTo('teacher', 'admin'), removeMember);


module.exports = router;