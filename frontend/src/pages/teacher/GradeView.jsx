// src/pages/teacher/GradeView.jsx (FINAL HOOKS ORDER FIX)

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSubmissionById,
  gradeSubmission,
  clearSelectedSubmission,
} from "../../redux/slices/submissionSlice";
import {
  Check,
  Edit3,
  MessageSquare,
  Link as LinkIcon,
  Download,
  Clock,
  Zap,
  UserCheck,
} from "lucide-react";
import Loader from "../../components/common/Loader";
import CommentSection from "../../components/common/CommentSection";

const TeacherGradeView = () => {
  // --- 1. HOOKS CALLS (ALL UNCONDITIONAL) ---
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedSubmission, isLoading } = useSelector(
    (state) => state.submissions
  );
  const { user } = useSelector((state) => state.auth);

  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lateOverride, setLateOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradeError, setGradeError] = useState(null);

  // Fetch the specific submission detail (Hook)
  useEffect(() => {
    dispatch(getSubmissionById(submissionId));
    return () => dispatch(clearSelectedSubmission()); // Cleanup on unmount
  }, [dispatch, submissionId]);

  // Initialize form state when submission data loads/changes (Hook)
  useEffect(() => {
    if (selectedSubmission) {
      setScore(selectedSubmission.grade?.score ?? "");
      setFeedback(selectedSubmission.grade?.feedback ?? "");
      setLateOverride(selectedSubmission.late);
    }
  }, [selectedSubmission]);

  // Define 'sub' here
  const sub = selectedSubmission;

  // --- HANDLER DEFINITION (Must be after hook calls) ---
  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setGradeError(null);

    if (!sub) {
      // Use 'sub' instead of 'selectedSubmission'
      setGradeError("Submission data not fully loaded. Cannot save grade.");
      return;
    }

    if (
      score === "" ||
      isNaN(score) ||
      score < 0 ||
      score > sub.assignmentId?.maxScore
    ) {
      setGradeError(
        `Please enter a valid numeric score (0 to ${
          sub.assignmentId?.maxScore || 100
        }).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        submissionId,
        score: parseFloat(score),
        feedback,
        lateOverride,
      };

      await dispatch(gradeSubmission(payload)).unwrap();

      alert("Grade saved successfully!");

      // Navigate back to the submissions queue
      const aId = sub.assignmentId._id || submissionId;
      const cId = sub.assignmentId.classId;
      navigate(`/teacher/classes/${cId}/assignments/${aId}/submissions`);
    } catch (err) {
      setGradeError(err.message || "Failed to save grade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 2. CONDITIONAL RETURN (Loader) MUST BE AFTER ALL HOOKS ---
  if (isLoading || !sub) {
    return <Loader message="Loading submission details..." />;
  }

  // --- 3. RENDERING (Data-dependent logic starts here) ---

  // Derived properties
  const maxScore = sub.assignmentId?.maxScore || 100;
  const isGraded = sub.status === "graded";
  const studentName = sub.studentId?.name || "N/A";
  // const studentEmail = sub.studentId?.email || "N/A"; // (Optional context)

  return (
    // KEY CHANGE 1: Removed max-w-7xl, relying on parent layout.
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700">
        {/* KEY CHANGE 2: Reduced header text size for mobile */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider flex flex-col sm:flex-row items-start sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            <Edit3 className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-[#ba68c8] shrink-0" />
            Grade Review:{" "}
          </div>
          <span className="text-[#03DAC6] ml-0 sm:ml-2 text-3xl sm:text-4xl wrap-break-words">
            {studentName}
          </span>
        </h1>
        {/* KEY CHANGE 3: Reduced paragraph text size for mobile */}
        <p className="text-[#bdbdbd] mt-1 text-sm sm:text-lg">
          Assignment: **{sub.assignmentId?.title || "Unknown Assignment"}**
        </p>
      </header>

      <form
        onSubmit={handleGradeSubmit}
        // KEY CHANGE 4: Grid layout changed to stack the grading panel first on mobile
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8"
      >
        {/* Grading Panel (Sticky Column) - KEY CHANGE 5: Removed 'sticky top-20' on mobile/tablet (default), added 'lg:sticky lg:top-20' for desktop */}
        <div className="lg:col-span-1 space-y-6 order-2 lg:order-3 bg-surface p-6 rounded-xl shadow-[0_0_20px_rgba(186,104,200,0.2)] lg:h-fit lg:sticky lg:top-20 border border-[#2f2f2f]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8] border-b border-gray-700 pb-2">
            Grading Controls
          </h2>

          {/* Score Input */}
          <div className="space-y-2">
            <label
              htmlFor="score"
              className=" text-sm font-medium text-[#e0e0e0] flex items-center"
            >
              <UserCheck className="h-4 w-4 mr-1 text-[#03DAC6]" />{" "}
              Numeric Score (Max: {maxScore})
            </label>
            <input
              type="number"
              id="score"
              name="score"
              min="0"
              max={maxScore}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
              className="w-full bg-gray-800 text-[#e0e0e0] text-3xl font-extrabold text-center border border-[#2f2f2f] rounded-lg py-4 px-3 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all"
            />
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <label
              htmlFor="feedback"
              className=" text-sm font-medium text-[#e0e0e0] flex items-center"
            >
              <MessageSquare className="h-4 w-4 mr-1 text-[#03DAC6]" />{" "}
              Written Feedback
            </label>
            <textarea
              id="feedback"
              name="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows="6"
              className="w-full bg-gray-800 text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2 px-3 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all"
              placeholder="Provide constructive feedback here..."
            />
          </div>

          {/* Late Override */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-md border border-gray-700">
            <label
              htmlFor="lateOverride"
              className="text-sm font-medium text-[#e0e0e0] flex items-center"
            >
              <Clock className="h-4 w-4 mr-2 text-yellow-400" /> Late Flag
              Override
            </label>
            <input
              type="checkbox"
              id="lateOverride"
              name="lateOverride"
              checked={lateOverride}
              onChange={(e) => setLateOverride(e.target.checked)}
              className="h-5 w-5 text-[#ba68c8] bg-gray-700 border-gray-600 rounded focus:ring-[#ba68c8] transition-all"
            />
          </div>

          {/* Status/Audit */}
          <div className="text-xs text-[#bdbdbd] pt-4 border-t border-gray-800 space-y-1">
            <p>
              Status:{" "}
              <span
                className={`font-semibold ${
                  isGraded ? "text-[#03DAC6]" : "text-yellow-400"
                }`}
              >
                {sub.status.toUpperCase()}
              </span>
            </p>
            {isGraded && <p>Graded By: {sub.grade?.gradedBy || user?.name}</p>}
          </div>

          {/* Error/Submit */}
          {gradeError && (
            <div className="bg-red-900/40 text-red-400 p-3 rounded-lg border border-red-700 text-sm font-medium animate-pulse">
              {gradeError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#ba68c8] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-violet-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.01]"
          >
            <Zap className="h-5 w-5 mr-2" />
            {isSubmitting
              ? "Saving Grade..."
              : isGraded
              ? "Update Grade"
              : "Save Grade"}
          </button>
        </div>

        {/* Submission Content Viewer (Left/Center Column) - KEY CHANGE 6: Order is correct for mobile stacking */}
        <div className="lg:col-span-2 space-y-8 order-1 lg:order-1">
          <div className="bg-surface p-6 rounded-xl border border-[#2f2f2f] shadow-lg space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#03DAC6] border-b border-gray-700 pb-2">
              Submitted Content
            </h2>

            {/* Status Alert - KEY CHANGE 7: Reduced padding */}
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                sub.late
                  ? "bg-red-900/40 text-red-400 border border-red-700"
                  : "bg-[#03DAC6]/20 text-[#03DAC6] border border-teal-600"
              }`}
            >
              {sub.late
                ? "🚩 This submission was marked LATE."
                : "✅ Submitted on time."}
              <span className="ml-4 text-[#bdbdbd] block sm:inline">
                ({new Date(sub.submittedAt).toLocaleString()})
              </span>
            </div>

            {/* Files/Links List */}
            {sub.linkOrFiles?.length > 0 ? (
              <div className="space-y-3">
                {sub.linkOrFiles.map((item, index) => (
                  <a
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    // KEY CHANGE 8: Reduced padding and ensured truncation
                    className="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 transform hover:scale-[1.005]"
                  >
                    <span className="flex items-center text-[#e0e0e0] font-medium truncate">
                      {item.contentType === "link" ? (
                        <LinkIcon className="h-5 w-5 mr-3 text-[#ba68c8] shrink-0" />
                      ) : (
                        <Download className="h-5 w-5 mr-3 text-[#03DAC6] shrink-0" />
                      )}
                      {item.fileName || item.url}
                    </span>
                    <span className="text-xs text-[#bdbdbd] uppercase ml-2 shrink-0">
                      {item.contentType || "Link"}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-gray-800 rounded-lg text-[#bdbdbd]">
                No files or links were submitted.
              </div>
            )}
          </div>

          {/* CRITICAL INTEGRATION: Comments Section */}
          <CommentSection submissionId={submissionId} />
        </div>
      </form>
    </div>
  );
};

export default TeacherGradeView;