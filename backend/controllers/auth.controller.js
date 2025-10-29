// /controllers/auth.controller.js

const asyncHandler = require('express-async-handler');
const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id) => {
    // CRITICAL: process.env.JWT_SECRET must be defined and non-empty
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Access token lifetime
    });
};

/**
 * @desc    Register a new user (Student/Teacher/Admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please enter all required fields: name, email, and password.');
    }

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // 2. Set default role (defaults all direct signups to student)
    const userRole = (role === 'teacher' || role === 'admin') ? 'student' : 'student';

    // 3. Create the user
    const user = await User.create({
        name,
        email,
        passwordHash: password, // The User model pre-save hook handles hashing
        role: userRole,
    });

    // Check if the user creation was successful and returned a valid object
    if (user && user._id) {
        res.status(201).json({
            _id: user._id, // Use _id consistently
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        // This block catches internal Mongoose/DB save failures not caught by Mongoose validators
        res.status(400);
        throw new Error('Invalid user data or database save failed.');
    }
});

/**
 * @desc    Authenticate a user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    // 1. Check for user email
    // Use .select('+passwordHash') if you excluded it by default in the schema (not necessary if only using .select('-passwordHash') elsewhere)
    const user = await User.findOne({ email }); 

    // 2. Check password (crashes often happen here if user's passwordHash in DB is null/empty)
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id, // Use _id consistently
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid credentials');
    }
});

/**
 * @desc    Get current user profile data
 * @route   GET /api/me
 * @access  Private (Requires authentication)
 */
const getMe = asyncHandler(async (req, res) => {
    // req.user is attached by the 'protect' middleware
    res.status(200).json(req.user);
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
};