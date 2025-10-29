// /routes/auth.routes.js (CLEANED)

const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getMe 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/auth/register (Public)
router.post('/register', registerUser); 

// POST /api/auth/login (Public)
router.post('/login', loginUser);

// GET /api/auth/me (Private - fetches current user profile)
router.get('/me', protect, getMe);

module.exports = router;