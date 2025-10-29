// /models/Class.model.js

const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Class title is required'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Class join code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        // Enforce a simple alphanumeric code structure for joining
        match: [/^[A-Z0-9]{6}$/, 'Code must be 6 alphanumeric characters'] 
    },
    description: {
        type: String,
        required: false,
        maxlength: 500
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A teacher must be assigned to the class']
    },
    // The members array tracks all students and can be used for class-specific roles
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        roleInClass: { // Redundant but useful for future flexibility/audit
            type: String,
            enum: ['student', 'teacher'],
            default: 'student'
        },
        _id: false // Prevents Mongoose from creating an extra _id for subdocuments
    }],
    createdBy: { // Audit field
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Ensure a compound unique index on member userId within a class
ClassSchema.index({ 'members.userId': 1, _id: 1 });

module.exports = mongoose.model('Class', ClassSchema);