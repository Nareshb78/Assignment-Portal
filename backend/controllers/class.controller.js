const asyncHandler = require("express-async-handler");
const Class = require("../models/Class.model");
const User = require("../models/User.model");
const APIFeatures = require("../utils/apiFeatures");
const mongoose = require("mongoose");

// Helper to check if a user is the teacher or admin (ROBUST ID COMPARISON FIX)
const isTeacherOrAdmin = (user, classObj) => {
  if (user.role === "admin") return true;

  const userIdStr = user._id?.toString();
  const teacherIdStr =
    classObj?.teacherId?._id?.toString() || classObj?.teacherId?.toString();

  return !!(classObj && userIdStr === teacherIdStr);
};


/**
 * @desc    Create a new class
 * @route   POST /api/classes
 * @access  Private/Teacher, Admin
 */
const createClass = asyncHandler(async (req, res) => {
  const { title, description, code } = req.body;

  if (!title || !code) {
    res.status(400);
    throw new Error("Please provide a class title and a unique code.");
  }

  const rawTeacherId =
    req.user.role === "teacher" ? req.user._id : req.body.teacherId;

  if (!rawTeacherId) {
    res.status(400);
    throw new Error("A teacher ID must be assigned for this class.");
  }

  // 1. Validate ID format and existence
  if (!mongoose.Types.ObjectId.isValid(rawTeacherId)) {
    res.status(400);
    throw new Error("Invalid Teacher ID format provided.");
  }

  // 2. Validate that the teacher exists and has a valid role
  const teacherUser = await User.findById(rawTeacherId);

  if (
    !teacherUser ||
    (teacherUser.role !== "teacher" && teacherUser.role !== "admin")
  ) {
    res.status(400);
    throw new Error(
      "Assigned teacher user not found or does not have a valid role (Teacher/Admin)."
    );
  }

  const teacherId = teacherUser._id;

  // Check if the code is unique
  const existingClass = await Class.findOne({ code });
  if (existingClass) {
    res.status(400);
    throw new Error(
      "This class code is already in use. Please choose another."
    );
  }

  // Create the class with the validated IDs
  const newClass = await Class.create({
    title,
    description,
    code,
    teacherId: teacherId,
    createdBy: req.user._id,
    members: [{ userId: teacherId, roleInClass: teacherUser.role }],
  });

  res.status(201).json({
    status: "success",
    class: newClass,
  });
});

/**
 * @desc    Get paginated list of classes (filtered by membership)
 * @route   GET /api/classes?mine=1&page=...
 * @access  Private/All roles
 */
const getClasses = asyncHandler(async (req, res) => {
  const initialFilter = {};

  const isAdmin = req.user.role === "admin";
  const isBypassRequested =
    req.query.mine === "0" || req.query.mine === "false";

  const shouldFilterByMembership = !isAdmin || !isBypassRequested;

  if (shouldFilterByMembership) {
    initialFilter["members.userId"] = req.user._id;
  }

  // --- QUERY EXECUTION ---

  let baseQuery = Class.find(initialFilter).populate("teacherId", "name email");

  const queryFeatures = new APIFeatures(baseQuery, req.query)
    .search()
    .paginate();

  const countQueryFeatures = new APIFeatures(
    Class.find(initialFilter),
    req.query
  ).search();

  const total = await Class.countDocuments(countQueryFeatures.query.getQuery());
  const classes = await queryFeatures.query;

  res.status(200).json({
    status: "success",
    pagination: {
      total,
      page: req.query.page * 1 || 1,
      limit: req.query.limit * 1 || 10,
      pages: Math.ceil(total / (req.query.limit * 1 || 10)),
    },
    items: classes,
  });
});

/**
 * @desc    Get single class details (Roster Fetch)
 * @route   GET /api/classes/:classId
 * @access  Private/Member only
 */
const getClassById = asyncHandler(async (req, res) => {
  const classId = req.params.classId;

  const classObj = await Class.findById(classId)
    .populate("teacherId", "name email")
    .populate("members.userId", "name email role");

  if (!classObj) {
    res.status(404);
    throw new Error("Class not found.");
  }

  // Robust checks for both populated and unpopulated cases
  const isMember = classObj.members.some(
    (member) =>
      member.userId?._id?.toString() === req.user._id.toString() ||
      member.userId?.toString() === req.user._id.toString()
  );

  const isTeacher =
    classObj.teacherId?._id?.toString() === req.user._id.toString() ||
    classObj.teacherId?.toString() === req.user._id.toString();

  if (!isMember && !isTeacher && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Forbidden: You are not a member of this class.");
  }

  res.status(200).json({
    status: "success",
    class: classObj,
  });
});


/**
 * @desc    Enroll a student into a class
 * @route   POST /api/classes/:classId/enroll
 * @access  Private/Teacher, Admin, Student
 */
const enrollStudent = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const classId = req.params.classId;

  let userToEnroll;
  let classToUpdate;

  // Determine the user and class based on the request
  if (req.user.role === "student" && code) {
    // Student self-enrollment via code
    userToEnroll = req.user;
    classToUpdate = await Class.findOne({ code });

    if (!classToUpdate) {
      res.status(404);
      throw new Error("Class not found with that code.");
    }
  } else if (
    (req.user.role === "teacher" || req.user.role === "admin") &&
    email
  ) {
    // Teacher/Admin enrollment via email
    userToEnroll = await User.findOne({ email }).select("_id name email");
    classToUpdate = await Class.findById(classId);

    if (!userToEnroll) {
      res.status(404);
      throw new Error(`User with email ${email} not found.`);
    }

    // Teacher/Admin Authorization Check: Check if current user is owner (or Admin)
    if (
      req.user.role === "teacher" &&
      !isTeacherOrAdmin(req.user, classToUpdate)
    ) {
      res.status(403);
      throw new Error(
        "Forbidden: Teachers can only enroll students in their own classes."
      );
    }
  } else {
    res.status(400);
    throw new Error(
      "Invalid enrollment request. Provide email (Admin/Teacher) or code (Student)."
    );
  }

  if (!classToUpdate) {
    res.status(404);
    throw new Error("Class not found.");
  }

  // Check if already a member
  const isMember = classToUpdate.members.some(
    (m) => m.userId.toString() === userToEnroll._id.toString()
  );
  if (isMember) {
    res.status(400);
    throw new Error(`${userToEnroll.name} is already a member of this class.`);
  }

  // Perform enrollment
  classToUpdate.members.push({
    userId: userToEnroll._id,
    roleInClass: "student",
  });
  await classToUpdate.save();

  res.status(200).json({
    status: "success",
    message: `${userToEnroll.name} successfully enrolled in ${classToUpdate.title}.`,
    class: classToUpdate,
  });
});

/**
 * @desc    Remove a member from a class
 * @route   DELETE /api/classes/:classId/members/:userId
 * @access  Private/Teacher, Admin
 */
const removeMember = asyncHandler(async (req, res) => {
  const classId = req.params.classId;
  const userIdToRemove = req.params.userId;

  const classObj = await Class.findById(classId).populate("members.userId", "name email _id");

  if (!classObj) {
    res.status(404);
    throw new Error("Class not found.");
  }

  if (!isTeacherOrAdmin(req.user, classObj)) {
    res.status(403);
    throw new Error("Forbidden: Only the class teacher or an admin can remove members.");
  }

  if (classObj.teacherId.toString() === userIdToRemove) {
    res.status(400);
    throw new Error("Cannot remove the assigned class teacher. Reassign the teacher first.");
  }

  const initialLength = classObj.members.length;

  // Log all member IDs before filtering
  console.log("=== DEBUG REMOVE MEMBER ===");
  console.log("Target userIdToRemove:", userIdToRemove);
  console.log(
    "Class member IDs:",
    classObj.members.map((m) =>
      m.userId?._id?.toString() || m.userId?.toString()
    )
  );

  classObj.members = classObj.members.filter((member) => {
    const memberIdStr =
      member.userId?._id?.toString() ||
      member.userId?.toString?.() ||
      member.userId;
    return memberIdStr !== userIdToRemove;
  });

  console.log(
    "After filter, remaining IDs:",
    classObj.members.map((m) =>
      m.userId?._id?.toString() || m.userId?.toString()
    )
  );

  if (classObj.members.length === initialLength) {
    res.status(404);
    throw new Error("User not found in class members.");
  }

  await classObj.save();

  res.status(200).json({
    status: "success",
    message: "Member successfully removed.",
    class: classObj,
  });
});


/**
 * @desc    Update class details
 * @route   PATCH /api/classes/:classId
 * @access  Private/Teacher, Admin
 */
const updateClass = asyncHandler(async (req, res) => {
  const classId = req.params.classId;
  const { title, description, code, teacherId } = req.body;

  const classObj = await Class.findById(classId);

  if (!classObj) {
    res.status(404);
    throw new Error("Class not found.");
  }

  // Authorization: Must be the class teacher OR an admin (FIXED)
  if (!isTeacherOrAdmin(req.user, classObj)) {
    res.status(403);
    throw new Error(
      "Forbidden: Only the class teacher or an admin can update class details."
    );
  }

  // Admin is required to change the teacherId
  if (teacherId && req.user.role !== "admin") {
    res.status(403);
    throw new Error(
      "Forbidden: Only administrators can reassign the class teacher."
    );
  }

  // Update fields
  if (title) classObj.title = title;
  if (description) classObj.description = description;

  // Handle code change (ensure uniqueness if changed)
  if (code && code !== classObj.code) {
    const existing = await Class.findOne({ code });
    if (existing) {
      res.status(400);
      throw new Error("This class code is already in use.");
    }
    classObj.code = code;
  }

  // Handle teacher reassignment (Admin only)
  if (teacherId && req.user.role === "admin") {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      res.status(400);
      throw new Error("Invalid Teacher ID format provided for reassignment.");
    }

    const newTeacher = await User.findById(teacherId);
    if (!newTeacher || newTeacher.role !== "teacher") {
      res.status(400);
      throw new Error("New teacher ID is invalid or user is not a teacher.");
    }

    // Remove old teacher if necessary
    classObj.members = classObj.members.filter(
      (m) => m.userId.toString() !== classObj.teacherId.toString()
    );

    classObj.teacherId = teacherId;

    // Add new teacher to members if they weren't already
    const isNewTeacherMember = classObj.members.some(
      (m) => m.userId.toString() === teacherId.toString()
    );
    if (!isNewTeacherMember) {
      classObj.members.push({ userId: teacherId, roleInClass: "teacher" });
    }
  }

  const updatedClass = await classObj.save();

  res.status(200).json({
    status: "success",
    class: updatedClass,
  });
});

/**
 * @desc    Delete a class
 * @route   DELETE /api/classes/:classId
 * @access  Private/Admin only
 */
const deleteClass = asyncHandler(async (req, res) => {
  const classId = req.params.classId;

  // NOTE: In a real app, deleting a class should also cascade delete or archive
  // all related Assignments and Submissions. For now, we only delete the class document.

  const deletedClass = await Class.findByIdAndDelete(classId);

  if (!deletedClass) {
    res.status(404);
    throw new Error("Class not found.");
  }

  res.status(200).json({
    status: "success",
    message: "Class deleted successfully.",
  });
});

module.exports = {
  createClass,
  getClasses,
  getClassById,
  enrollStudent,
  removeMember,
  updateClass,
  deleteClass,
};
