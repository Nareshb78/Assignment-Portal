const asyncHandler = require("express-async-handler");
const Assignment = require("../models/Assignment.model");
const Submission = require("../models/Submission.model");
const Class = require("../models/Class.model");
const APIFeatures = require("../utils/apiFeatures");
const { isTeacherOrAdmin } = require("./class.controller");
const mongoose = require('mongoose');

// Helper to check if user is the teacher of this class (used in routes/controllers)
const isClassTeacher = asyncHandler(async (req, res, next) => {
    const classId = req.params.classId;
    const classObj = await Class.findById(classId);

    if (!classObj) {
        res.status(404);
        throw new Error("Class not found.");
    }
    if (classObj.teacherId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Forbidden: You are not the teacher of this class.");
    }
    req.classObj = classObj;
    next();
});

/**
 * @desc    Create a new assignment
 * @route   POST /api/classes/:classId/assignments
 * @access  Private/Teacher
 */
const createAssignment = asyncHandler(async (req, res) => {
    const classId = req.params.classId;
    const { title, description, dueAt, attachments, maxScore } = req.body;

    if (!title || !dueAt) {
        res.status(400);
        throw new Error("Assignment title and due date are required.");
    }

    const classObj = await Class.findById(classId);

    if (!classObj) {
        res.status(404);
        throw new Error("Class not found.");
    }

    if (classObj.teacherId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error(
            "Forbidden: You can only create assignments in your own classes."
        );
    }
    if (new Date(dueAt) < new Date()) {
        res.status(400);
        throw new Error("Due date must be set in the future.");
    }

    const newAssignment = await Assignment.create({
        classId,
        title,
        description,
        dueAt,
        attachments,
        maxScore,
        createdBy: req.user._id,
    });

    res.status(201).json({
        status: "success",
        assignment: newAssignment,
    });
});

/**
 * @desc    Get paginated list of assignments for a class
 * @route   GET /api/classes/:classId/assignments?page=&q=&statusFilter=
 * @access  Private/Class Member
 */
const getAssignmentsByClass = asyncHandler(async (req, res) => {
    const classId = req.params.classId;

    const classObj = await Class.findById(classId);

    if (!classObj) {
        res.status(404);
        throw new Error("Class not found.");
    }
    const isMember = classObj.members.some(
        (member) => member.userId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Forbidden: You are not a member of this class.");
    }

    const filter = { classId };
    if (req.query.statusFilter) {
        const now = new Date();
        if (req.query.statusFilter === "upcoming") {
            filter.dueAt = { $gt: now };
        } else if (req.query.statusFilter === "overdue") {
            filter.dueAt = { $lt: now };
        }
    }

    const query = new APIFeatures(Assignment.find(filter), req.query)
        .search()
        .paginate();

    const assignments = await query.query;
    const total = await Assignment.countDocuments(filter);

    res.status(200).json({
        status: "success",
        pagination: {
            total,
            page: req.query.page * 1 || 1,
            limit: req.query.limit * 1 || 10,
            pages: Math.ceil(total / (req.query.limit * 1 || 10)),
        },
        items: assignments,
    });
});

/**
 * @desc    Get single assignment details
 * @route   GET /api/classes/:classId/assignments/:assignmentId
 * @access  Private/Class Member
 */
const getAssignmentById = asyncHandler(async (req, res) => {
    const { classId, assignmentId } = req.params;

    const assignment = await Assignment.findOne({ _id: assignmentId, classId });

    if (!assignment) {
        res.status(404);
        throw new Error("Assignment not found.");
    }

    const classObj = await Class.findById(classId);

    // Authorization Check: Must be a member (student or teacher) of the class
    const isMember = classObj.members.some(
        (member) => member.userId.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== "admin") {
        res.status(403);
        throw new Error(
            "Forbidden: You are not a member of the class this assignment belongs to."
        );
    }

    res.status(200).json({
        status: "success",
        assignment,
    });
});

/**
 * @desc    Update an assignment
 * @route   PATCH /api/classes/:classId/assignments/:assignmentId
 * @access  Private/Teacher
 */
const updateAssignment = asyncHandler(async (req, res) => {
    const { classId, assignmentId } = req.params;
    const updateFields = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment || assignment.classId.toString() !== classId) {
        res.status(404);
        throw new Error("Assignment not found in this class.");
    }

    // Authorization Check: Must be the original creator (teacher)
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Forbidden: You can only update assignments you created.");
    }

    // Validation: dueAt must still be in the future if it is updated
    if (updateFields.dueAt && new Date(updateFields.dueAt) < new Date()) {
        res.status(400);
        throw new Error("New due date must be set in the future.");
    }

    // Apply updates
    const updatedAssignment = await Assignment.findByIdAndUpdate(
        assignmentId,
        updateFields,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: "success",
        message: "Assignment updated.",
        assignment: updatedAssignment,
    });
});

/**
 * @desc    Delete an assignment
 * @route   DELETE /api/classes/:classId/assignments/:assignmentId
 * @access  Private/Teacher, Admin
 */
const deleteAssignment = asyncHandler(async (req, res) => {
    const { classId, assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment || assignment.classId.toString() !== classId) {
        res.status(404);
        throw new Error("Assignment not found in this class.");
    }

    // Authorization Check: Must be the creator (teacher) OR Admin
    if (
        assignment.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        res.status(403);
        throw new Error(
            "Forbidden: Only the creator or an admin can delete this assignment."
        );
    }

    await Assignment.findByIdAndDelete(assignmentId);

    res.status(200).json({
        status: "success",
        message: "Assignment deleted successfully.",
    });
});

/**
 * @desc    Get aggregated metrics for the Teacher Dashboard
 * @route   GET /api/assignments/metrics/teacher
 * @access  Private/Teacher
 */
const getTeacherDashboardMetrics = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;

    // 1. Get all class IDs for this teacher
    const teacherClasses = await Class.find({ teacherId }).select("_id");
    const classIds = teacherClasses.map((c) => c._id);

    // --- EARLY EXIT FIX ---
    if (classIds.length === 0) {
        return res.status(200).json({
            status: "success",
            data: { pendingGradeCount: 0, averageScore: 0 },
        });
    }
    // -----------------------

    // 2. Get all assignment IDs in those classes
    const assignments = await Assignment.find({
        classId: { $in: classIds },
    }).select("_id");
    const assignmentIds = assignments.map((a) => a._id);

    if (assignmentIds.length === 0) {
        return res.status(200).json({
            status: "success",
            data: { pendingGradeCount: 0, averageScore: 0 },
        });
    }

    // 3. Aggregation pipeline to compute metrics (ROBUST VERSION)
    const metrics = await Submission.aggregate([
        { 
            $match: { 
                assignmentId: { $in: assignmentIds },
                // CRITICAL FIX: Only process submissions with a valid numeric score
                "grade.score": { $type: "number", $ne: null } 
            } 
        },
        // Group 1: Calculate counts and sums
        {
            $group: {
                _id: null,
                totalSubmissions: { $sum: 1 },
                pendingGradeCount: { 
                    $sum: { 
                        // Count pending (submitted, late) statuses
                        $cond: [
                            { $in: ["$status", ["submitted", "late"]] }, 
                            1, 
                            0
                        ]
                    } 
                },
                totalGradedScore: { $sum: "$grade.score" }, 
                totalGradedCount: { $sum: 1 } // Count submissions that passed the initial $match
            }
        },
        // Group 2: Calculate the final average
        {
            $project: {
                _id: 0,
                pendingGradeCount: "$pendingGradeCount",
                averageScore: {
                    $cond: [
                        // Avoid division by zero
                        { $gt: ["$totalGradedCount", 0] },
                        // Round the average score to 0 decimal places
                        { $round: [{ $divide: ["$totalGradedScore", "$totalGradedCount"] }, 0] },
                        0
                    ]
                }
            }
        }
    ]);

    // Format output
    const result = metrics[0] || { pendingGradeCount: 0, averageScore: 0 };
    
    res.status(200).json({
        status: "success",
        data: result,
    });
});

module.exports = {
    isClassTeacher,
    createAssignment,
    getAssignmentsByClass,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    getTeacherDashboardMetrics,
};