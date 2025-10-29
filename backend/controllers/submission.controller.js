const asyncHandler = require('express-async-handler');
const Submission = require('../models/Submission.model');
const Assignment = require('../models/Assignment.model'); 
const Class = require('../models/Class.model');
const APIFeatures = require('../utils/apiFeatures');
const mongoose = require('mongoose');

// Helper to check if user is the teacher of the class
const isTeacherOfClass = async (userId, classId) => {
    const classObj = await Class.findById(classId);
    return classObj && classObj.teacherId.toString() === userId.toString();
};

/**
 * @desc    Student submits (or resubmits/replaces) work (Unchanged)
 * @route   POST /api/classes/:classId/assignments/:assignmentId/submissions
 * @access  Private/Student
 */
const submitWork = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { linkOrFiles } = req.body;

    if (!linkOrFiles || linkOrFiles.length === 0) {
        res.status(400);
        throw new Error('Submission must contain at least one link or file reference.');
    }
    
    // 1. Check Assignment existence and Due Date
    const assignment = await Assignment.findById(assignmentId).select('dueAt classId');
    if (!assignment) {
        res.status(404);
        throw new Error('Assignment not found.');
    }
    
    // 2. Authorization: Must be a member of the class (Student role handled by route guard)
    const classObj = await Class.findById(assignment.classId);
    const isMember = classObj?.members.some(member => member.userId.toString() === req.user._id.toString());
    
    if (!isMember) {
        res.status(403);
        throw new Error('Forbidden: You are not enrolled in this class.');
    }

    // 3. Late Logic Check
    const dueAt = new Date(assignment.dueAt);
    const submittedAt = new Date();
    const isLate = submittedAt > dueAt;
    
    // Check for existing submission to handle resubmission
    const existingSubmission = await Submission.findOne({
        assignmentId,
        studentId: req.user._id
    });
    
    // Block or Mark Late after Due Date 
    if (isLate && existingSubmission?.status === 'graded') {
        res.status(403);
        throw new Error('Assignment is overdue and your submission has already been graded. Resubmission blocked.');
    }

    const submissionData = {
        assignmentId,
        studentId: req.user._id,
        linkOrFiles,
        submittedAt,
        late: isLate,
        status: 'submitted',
        grade: {}
    };

    let submission;
    
    if (existingSubmission) {
        submission = await Submission.findByIdAndUpdate(
            existingSubmission._id,
            submissionData,
            { new: true }
        );
    } else {
        submission = await Submission.create(submissionData);
    }

    res.status(201).json({
        status: 'success',
        message: existingSubmission ? 'Submission replaced successfully.' : 'Submission created successfully.',
        submission
    });
});

/**
 * @desc    Teacher views paginated submissions queue for an assignment (Unchanged)
 * @route   GET /api/classes/:cId/assignments/:aId/submissions?page=&status=
 * @access  Private/Teacher, Admin
 */
const getSubmissionsByAssignment = asyncHandler(async (req, res) => {
    const { assignmentId, classId } = req.params;

    // 1. Authorization: Must be the class teacher or admin
    if (req.user.role === 'teacher' && !(await isTeacherOfClass(req.user._id, classId))) {
        res.status(403);
        throw new Error('Forbidden: You can only view submissions for your own class assignments.');
    }
    
    // 2. Base filter
    const filter = { assignmentId };

    // Apply status filter 
    if (req.query.status) {
        filter.status = req.query.status;
    }
    
    const query = new APIFeatures(
        Submission.find(filter)
            .populate('studentId', 'name email'), 
        req.query
    ).paginate();

    const submissions = await query.query;
    const total = await Submission.countDocuments(filter); 

    res.status(200).json({
        status: 'success',
        pagination: {
            total,
            page: req.query.page * 1 || 1,
            limit: req.query.limit * 1 || 10,
            pages: Math.ceil(total / (req.query.limit * 1 || 10))
        },
        items: submissions
    });
});

/**
 * @desc    Get student's own submissions across all assignments (My Submissions page) (Unchanged)
 * @route   GET /api/submissions/me?page=
 * @access  Private/Student
 */
const getMySubmissions = asyncHandler(async (req, res) => {
    const filter = { studentId: req.user._id };

    const query = new APIFeatures(
        Submission.find(filter)
            .populate({
                path: 'assignmentId',
                select: 'title dueAt classId',
                populate: {
                    path: 'classId',
                    select: 'title'
                }
            }), 
        req.query
    ).paginate();

    const submissions = await query.query;
    const total = await Submission.countDocuments(filter); 

    res.status(200).json({
        status: 'success',
        pagination: {
            total,
            page: req.query.page * 1 || 1,
            limit: req.query.limit * 1 || 10,
            pages: Math.ceil(total / (req.query.limit * 1 || 10))
        },
        items: submissions
    });
});

/**
 * @desc    Get single submission detail
 * @route   GET /api/submissions/:submissionId
 * @access  Private/Owner or Teacher/Admin
 */
const getSubmissionById = asyncHandler(async (req, res) => {
    const submissionId = req.params.submissionId;

    const submission = await Submission.findById(submissionId)
        // CRITICAL FIX: Include title, dueAt, maxScore in the population
        .populate('assignmentId', 'title dueAt maxScore classId createdBy') 
        .populate('studentId', 'name email');
    
    if (!submission) {
        res.status(404);
        throw new Error('Submission not found.');
    }
    
    // Check for authorization against the populated assignment's classId
    const assignment = submission.assignmentId;
    
    // Authorization: Must be the owner (student) OR the class teacher OR an admin
    const isOwner = submission.studentId._id.toString() === req.user._id.toString();
    const isTeacher = await isTeacherOfClass(req.user._id, assignment.classId);
    
    if (!isOwner && !isTeacher && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Forbidden: You can only view your own submissions or submissions from your classes.');
    }

    res.status(200).json({
        status: 'success',
        submission
    });
});

// ----------------------------------------------------
// NEW ENDPOINT FOR STUDENT SUBMISSION FORM (Unchanged)
// ----------------------------------------------------

/**
 * @desc    Get single submission details by Assignment ID for the current user
 * @route   GET /api/submissions/by-assignment/:assignmentId
 * @access  Private/Authenticated Users (Student/Teacher/Admin)
 */
const getSubmissionByAssignmentId = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;

    // 1. Find the submission belonging to the current user (req.user._id) for this assignment
    const submission = await Submission.findOne({
        assignmentId: assignmentId,
        studentId: req.user._id 
    })
    .populate({
        path: 'assignmentId',
        select: 'title dueAt classId maxScore attachments',
        populate: {
            path: 'classId',
            select: 'title'
        }
    })
    .populate('studentId', 'name email');

    if (!submission) {
        res.status(404);
        throw new Error('No existing submission found for this assignment.');
    }
    
    res.status(200).json({
        status: 'success',
        submission: submission
    });
});

/**
 * @desc    Teacher grades a submission (Unchanged)
 * @route   PATCH /api/submissions/:submissionId/grade
 * @access  Private/Teacher
 */
const gradeSubmission = asyncHandler(async (req, res) => {
    const submissionId = req.params.submissionId;
    const { score, feedback, lateOverride } = req.body;
    
    if (score === undefined || score === null) {
        res.status(400);
        throw new Error('Score is required for grading.');
    }

    const submission = await Submission.findById(submissionId)
        .populate('assignmentId', 'classId');

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found.');
    }

    // 1. Authorization: Must be the class teacher
    const classId = submission.assignmentId.classId;
    if (!(await isTeacherOfClass(req.user._id, classId))) {
        res.status(403);
        throw new Error('Forbidden: You can only grade submissions for your own classes.');
    }
    
    // 2. Update grading fields
    submission.grade.score = score;
    submission.grade.feedback = feedback || '';
    submission.grade.gradedBy = req.user._id;
    submission.grade.gradedAt = new Date();
    submission.status = 'graded';
    submission.updatedBy = req.user._id;
    
    // 3. Late Override Logic
    if (lateOverride !== undefined) {
        submission.late = !!lateOverride; // Teacher can flip the late flag
    }

    const updatedSubmission = await submission.save();

    res.status(200).json({
        status: 'success',
        message: 'Submission graded successfully.',
        submission: updatedSubmission
    });
});

/**
 * @desc    Get grade distribution for an assignment or class (Unchanged)
 * @route   GET /api/classes/:classId/assignments/:assignmentId/grades/distribution
 * @access  Private/Teacher, Admin
 */
const getGradeDistribution = asyncHandler(async (req, res) => {
    const { assignmentId, classId } = req.params;

    // 1. Authorization: Must be the class teacher or admin
    if (req.user.role === 'teacher' && !(await isTeacherOfClass(req.user._id, classId))) {
        res.status(403);
        throw new Error('Forbidden: You can only view analytics for your own classes.');
    }
    
    // 2. MongoDB Aggregation Pipeline (Reviewing and confirming structure)
    const pipeline = [
        { 
            $match: { 
                assignmentId: new mongoose.Types.ObjectId(assignmentId),
                status: 'graded' 
            }
        },
        {
            $project: {
                score: "$grade.score" 
            }
        },
        // Group and bucket into letter grades/score ranges
        {
            $bucket: {
                groupBy: "$score",
                boundaries: [0, 60, 70, 80, 90, 101], 
                default: "Other",
                output: {
                    count: { $sum: 1 }
                }
            }
        },
        // Label the buckets for clearer response
        {
            $project: {
                _id: 0,
                range: {
                    $switch: {
                        branches: [
                            { case: { $lt: ["$_id", 60] }, then: "0-59 (F)" },
                            { case: { $lt: ["$_id", 70] }, then: "60-69 (D)" },
                            { case: { $lt: ["$_id", 80] }, then: "70-79 (C)" },
                            { case: { $lt: ["$_id", 90] }, then: "80-89 (B)" },
                            { case: { $lt: ["$_id", 101] }, then: "90-100 (A)" },
                        ],
                        default: "Ungraded/Other"
                    }
                },
                count: 1
            }
        }
    ];

    const distribution = await Submission.aggregate(pipeline);

    res.status(200).json({
        status: 'success',
        assignmentId,
        distribution
    });
});


module.exports = {
    submitWork,
    getSubmissionsByAssignment,
    getMySubmissions,
    getSubmissionById,
    gradeSubmission,
    getGradeDistribution,
    getSubmissionByAssignmentId
};