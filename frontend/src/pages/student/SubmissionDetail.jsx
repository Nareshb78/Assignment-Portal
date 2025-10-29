// src/pages/student/SubmissionDetail.jsx (FINAL STUDENT SUBMISSION LOGIC FIX)

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  clearSelectedSubmission,
  submitAssignmentWork,
} from "../../redux/slices/submissionSlice";
import {
  CheckCircle,
  XCircle,
  Clock,
  Link as LinkIcon,
  Download,
  Zap,
  Award,
  FileText,
  MessageSquare,
  UserCheck,
  Upload,
  Send,
} from "lucide-react";
import Loader from "../../components/common/Loader";
import CommentSection from "../../components/common/CommentSection";

// MOCK DATA: Represents the base structure of a new submission
const NEW_SUBMISSION_MOCK_ASSIGNMENT = {
  title: "Final Project",
  dueAt: new Date(Date.now() + 86400000 * 5),
  maxScore: 100,
  classId: "MOCK_CLASS_ID",
};

const StudentSubmissionDetail = () => {
  const { assignmentId } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // --- Submission State Management ---
  const [localSubmission, setLocalSubmission] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // --- Form State ---
  const [submissionLink, setSubmissionLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(null); // { type: 'success'|'error', message: string }

  // Fetch Logic: Find existing submission for this assignment/user
  useEffect(() => {
    if (!assignmentId) return;

    const fetchStudentSubmission = async () => {
      setFetchLoading(true);
      try {
        // NOTE: This call is the one registered on the backend
        const response = await axios.get(
          `/api/submissions/by-assignment/${assignmentId}`
        );

        // Success: Submission found (Time for Review)
        setLocalSubmission(response.data.submission);
        setFetchError(null);
      } catch (err) {
        // Failure: 404/Error means no submission exists (Time to Submit)
        setFetchError(
          err.response?.data?.message || "No submission record found."
        );
        setLocalSubmission(null);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchStudentSubmission();

    return () => dispatch(clearSelectedSubmission());
  }, [assignmentId, dispatch]);

  // Submission Handler (POST /api/classes/:classId/assignments/:assignmentId/submissions)
  const handleSubmission = async (e) => {
    e.preventDefault();
    setFormStatus(null);
    if (!submissionLink.trim()) return;

    setIsSubmitting(true);

    // Mocking the classId since it's not in the URL for this route
    const classId =
      localSubmission?.assignmentId?.classId ||
      NEW_SUBMISSION_MOCK_ASSIGNMENT.classId;

    const payload = {
      classId,
      assignmentId,
      linkOrFiles: [
        {
          type: "link",
          url: submissionLink.trim(),
          contentType: "text/uri",
        },
      ],
    };

    try {
      const result = await dispatch(submitAssignmentWork(payload)).unwrap();

      setFormStatus({
        type: "success",
        message: "Submission successful! Refreshing status.",
      });

      // On successful submission, update local state to show review mode immediately
      const assignmentInfo =
        localSubmission?.assignmentId || NEW_SUBMISSION_MOCK_ASSIGNMENT;

      setLocalSubmission({
        ...result, // Actual submission data from backend
        assignmentId: assignmentInfo, // Preserve assignment context
      });
      setFetchError(null);
    } catch (err) {
      // FIX: Ensure the error message is a string before setting state
      const errorMessage =
        err?.message || "Submission failed due to server error.";
      setFormStatus({ type: "error", message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Loading and Initial Check ---
  if (fetchLoading) {
    return (
      <Loader
        message={`Loading assignment ${assignmentId?.slice(
          -4
        )} instructions...`}
      />
    );
  }

  const sub = localSubmission;
  const assignmentInfo =
    localSubmission?.assignmentId || NEW_SUBMISSION_MOCK_ASSIGNMENT;

  // --- UI Logic: Submission Form (If no submission found) ---
  if (!sub) {
    return (
      // KEY CHANGE 1: Removed max-width, relying on parent layout, but kept horizontal padding.
      <div className="space-y-8 sm:space-y-10">
        {/* KEY CHANGE 2: Reduced header text size for mobile */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#03DAC6] tracking-wider">
          Submit: {assignmentInfo.title}
        </h1>
        {/* KEY CHANGE 3: Reduced paragraph text size for mobile */}
        <p className="text-[#bdbdbd] text-sm sm:text-lg">
          Due: {new Date(assignmentInfo.dueAt).toLocaleString()}
        </p>

        <form
          onSubmit={handleSubmission}
          // KEY CHANGE 4: Reduced padding to 'p-6 sm:p-8'
          className="bg-surface p-6 sm:p-8 rounded-xl border border-gray-700 space-y-5 shadow-lg"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8] flex items-center mb-4">
            <Upload className="h-6 w-6 mr-3 flex-shrink-0" /> Link Submission
          </h2>

          {formStatus?.type === "success" && (
            <div className="bg-green-700/30 text-green-400 p-3 rounded-lg border border-green-700 text-sm">
              {formStatus.message}
            </div>
          )}
          {formStatus?.type === "error" && (
            <div className="bg-red-900/40 text-red-400 p-3 rounded-lg border border-red-700 text-sm">
              {formStatus.message}
            </div>
          )}

          <input
            type="url"
            placeholder="Paste GitHub or Cloud Drive Link here"
            value={submissionLink}
            onChange={(e) => setSubmissionLink(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-4 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all placeholder-[#bdbdbd]"
          />

          <button
            type="submit"
            disabled={isSubmitting || submissionLink.length < 5}
            className="w-full bg-[#03DAC6] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-teal-600 transition-all duration-200 disabled:bg-gray-600 flex items-center justify-center transform hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <Loader size="sm" />
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" /> Final Submission
              </>
            )}
          </button>
          {fetchError && (
            <p className="text-red-400 text-sm mt-3">{fetchError}</p>
          )}
        </form>
      </div>
    );
  }

  // --- UI Logic: Submission Review (If submission is found) ---
  const isGraded = sub.status === "graded";
  const score = sub.grade?.score;
  const feedback = sub.grade?.feedback;
  const maxScore = sub.assignmentId?.maxScore || 100;
  const gradePercentage = isGraded ? Math.round((score / maxScore) * 100) : 0;

  // Helper component for submitted content links/files
  const LinkOrFileItem = ({ item }) => {
    const isLink = item.contentType === "text/uri";
    const iconColor = isLink ? "text-[#ba68c8]" : "text-[#03DAC6]";
    const Icon = isLink ? LinkIcon : Download;

    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 transform hover:scale-[1.005]"
      >
        <span className="flex items-center text-[#e0e0e0] font-medium truncate">
          <Icon className={`h-5 w-5 mr-3 flex-shrink-0 ${iconColor}`} />
          {item.fileName || (isLink ? "Submitted Link" : "Submitted File")}
        </span>
        <span className="text-xs text-[#bdbdbd] uppercase ml-3">
          {isLink ? "VIEW LINK" : "DOWNLOAD"}
        </span>
      </a>
    );
  };

  return (
    // KEY CHANGE 5: Removed max-width for full component responsiveness
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700">
        {/* KEY CHANGE 6: Reduced header text size for mobile */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider">
          Submission Review
        </h1>
        {/* KEY CHANGE 7: Reduced paragraph text size for mobile */}
        <p className="text-[#bdbdbd] mt-1 text-sm sm:text-lg">
          Assignment: **{sub.assignmentId?.title || "Unknown Assignment"}**
        </p>
      </header>

      {/* Score Card (Review Mode) - KEY CHANGE 8: Grid layout change for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-gray-700 shadow-[0_0_20px_rgba(186,104,200,0.1)] transition-transform duration-300 hover:scale-[1.01]">
          <h3 className="text-xl font-bold text-[#ba68c8] border-b border-gray-700 pb-2">
            Final Grade
          </h3>
          {isGraded ? (
            <div className="text-center pt-4">
              <p className="text-6xl font-extrabold text-[#ba68c8]">{score}</p>
              <p className="text-lg font-medium text-[#bdbdbd]">
                out of {maxScore}
              </p>
              <div className="flex justify-center items-center mt-3 p-1.5 rounded-full bg-[#03DAC6]/20 text-[#03DAC6]">
                <Award className="h-5 w-5 mr-2" />
                <span className="font-semibold">
                  {gradePercentage}% Achieved
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Zap className="h-10 w-10 mx-auto text-yellow-400 animate-pulse" />
              <p className="text-xl font-medium text-yellow-400 mt-3">
                PENDING GRADE
              </p>
              <p className="text-sm text-[#bdbdbd] mt-1">
                Awaiting teacher review.
              </p>
            </div>
          )}
        </div>

        {/* Status and Deadlines (Review Mode) - KEY CHANGE 9: Spans 2 columns on medium, 1 on small */}
        <div
          title="Timeline & Status"
          className="col-span-1 sm:col-span-2 bg-surface p-6 rounded-xl border border-[#2f2f2f] space-y-4 shadow-lg"
        >
          <h3 className="text-xl font-bold text-[#e0e0e0] border-b border-gray-700 pb-2 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-[#03DAC6]" /> Timeline & Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`col-span-2 p-3 rounded-lg text-sm font-medium ${
                sub.late
                  ? "bg-red-900/40 text-red-400 border border-red-700"
                  : "bg-green-700/30 text-green-400 border border-green-700"
              }`}
            >
              {sub.late
                ? "🚩 Your submission was marked LATE."
                : "✅ Submission received ON TIME."}
            </div>
            {/* Added date details for clarity */}
            <div className="text-[#bdbdbd] text-sm flex items-center">
              <Clock className="h-4 w-4 mr-2 text-[#ba68c8]" /> Submitted:{" "}
              {new Date(sub.submittedAt).toLocaleString()}
            </div>
            <div className="text-[#bdbdbd] text-sm flex items-center">
              <UserCheck className="h-4 w-4 mr-2 text-[#ba68c8]" /> Reviewed:{" "}
              {isGraded ? new Date(sub.grade.gradedAt).toLocaleString() : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Feedback and Files (Review Mode) - KEY CHANGE 10: Grid layout change for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Submitted Files/Links */}
        <div
          title="Your Submitted Content"
          className="bg-surface p-6 rounded-xl border border-[#2f2f2f] space-y-4 shadow-lg"
        >
          <h3 className="text-xl font-bold text-[#e0e0e0] border-b border-gray-700 pb-2 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-[#03DAC6]" /> Your Submitted
            Content
          </h3>
          {sub.linkOrFiles?.length > 0 ? (
            <div className="space-y-3">
              {sub.linkOrFiles.map((item, index) => (
                <LinkOrFileItem key={index} item={item} />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center bg-gray-800 rounded-lg text-[#bdbdbd]">
              No content was recorded for this submission.
            </div>
          )}
        </div>

        {/* Feedback */}
        <div
          title="Teacher Feedback"
          className="bg-surface p-6 rounded-xl border border-[#2f2f2f] space-y-4 shadow-lg"
        >
          <h3 className="text-xl font-bold text-[#e0e0e0] border-b border-gray-700 pb-2 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-[#03DAC6]" /> Teacher
            Feedback
          </h3>
          <div className="bg-gray-800 p-4 rounded-lg min-h-[150px] border border-gray-700">
            <p className="text-[#e0e0e0] whitespace-pre-wrap">
              {isGraded && feedback
                ? feedback
                : isGraded
                ? "No written feedback provided."
                : "Feedback pending grade."}
            </p>
          </div>
        </div>
      </div>

      {/* Comments Section Placeholder (For future integration) */}
      <CommentSection submissionId={sub._id} />
    </div>
  );
};

export default StudentSubmissionDetail;
