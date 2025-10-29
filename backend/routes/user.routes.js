// /routes/user.routes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { 
    getUsers, 
    updateUserRole, 
    updateMyProfile 
} = require('../controllers/user.controller');

// GET /api/users?role=&q=&page= (Admin only - Paginated list of users)
router.get('/', protect, restrictTo('admin'), getUsers);

// PATCH /api/users/:id/role (Admin only - Change user role)
router.patch('/:userId/role', protect, restrictTo('admin'), updateUserRole);

// PATCH /api/me (Authenticated users - Profile updates)
router.patch('/me', protect, updateMyProfile);

module.exports = router;