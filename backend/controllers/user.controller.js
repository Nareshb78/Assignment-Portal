// /controllers/user.controller.js

const asyncHandler = require('express-async-handler');
const User = require('../models/User.model');
const APIFeatures = require('../utils/apiFeatures');

/**
 * @desc    Get paginated list of all users
 * @route   GET /api/users?role=&q=&page=
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
    // 1. Setup Features for Pagination and Querying
    const queryFeatures = new APIFeatures(User.find().select('-passwordHash'), req.query)
        .filter() 
        .search();
        
    // 2. Setup a separate Query for Counting (No Pagination)
    // We clone the features BEFORE applying pagination, then execute search/filter.
    // We use .lean() to ensure the query is a plain object for counting.
    const countQuery = new APIFeatures(User.find().select('-passwordHash'), req.query)
        .filter() 
        .search(); 

    // 3. Execute queries
    
    // Execute the main paginated query
    const users = await queryFeatures.paginate().query;
    
    // Execute count using the count query's final conditions
    // We extract the internal Mongoose filter object using .getFilter() (Mongoose 6+) or similar method.
    // If your Mongoose version is older, you might need to use query.query.find() instead.
    const total = await User.countDocuments(countQuery.query.getFilter()); 


    // 4. Response
    res.status(200).json({
        status: 'success',
        results: users.length,
        pagination: {
            total,
            page: req.query.page * 1 || 1,
            limit: req.query.limit * 1 || 10,
            // Calculate pages based on the accurate total
            pages: Math.ceil(total / (req.query.limit * 1 || 10))
        },
        items: users
    });
});

/**
 * @desc    Update a user's role
 * @route   PATCH /api/users/:userId/role
 * @access  Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const userId = req.params.userId;

    // Basic validation
    if (!role || !['student', 'teacher', 'admin'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role specified.');
    }

    // Find and update
    const user = await User.findByIdAndUpdate(
        userId, 
        { role }, 
        { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    res.status(200).json({
        status: 'success',
        message: `Role updated to ${role}`,
        user
    });
});

/**
 * @desc    Update current authenticated user's profile
 * @route   PATCH /api/me
 * @access  Private
 */
const updateMyProfile = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        // Update basic fields
        if (name) user.name = name;
        if (email) user.email = email;
        
        // Handle password change (re-uses pre-save hook)
        if (password) {
             user.passwordHash = password; // Hashing happens in the model's pre-save hook
        }

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getUsers,
    updateUserRole,
    updateMyProfile,
};