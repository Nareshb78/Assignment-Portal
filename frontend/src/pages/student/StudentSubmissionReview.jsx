// src/pages/student/StudentSubmissionReview.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  getSubmissionById,
  clearSelectedSubmission,
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
} from "lucide-react";
import Loader from "../../components/common/Loader";
import CommentSection from "../../components/common/CommentSection"; // For discussion

const StudentSubmissionReview = () => {
  // CRITICAL: We capture the submissionId here, which the list component passes.
  const { submissionId } = useParams();
  const dispatch = useDispatch();
  const { selectedSubmission: sub, isLoading } = useSelector(
    (state) => state.submissions
  );

  // Fetch the specific submission detail
  useEffect(() => {
    if (submissionId) {
      dispatch(getSubmissionById(submissionId));
    }
    return () => dispatch(clearSelectedSubmission());
  }, [dispatch, submissionId]);

  if (isLoading || !sub) {
    return <Loader message="Loading submission review..." />;
  }

  // --- Submission Data ---
  const isGraded = sub.status === "graded";
  const score = sub.grade?.score;
  const feedback = sub.grade?.feedback;
  const maxScore = sub.assignmentId?.maxScore || 100;
  const gradePercentage = isGraded ? Math.round((score / maxScore) * 100) : 0;

  // UI Helpers (simplified, pulled from existing code)
  const ReviewCard = ({ title, children, icon: Icon }) => (
    <div
      className={`bg-surface p-6 rounded-xl border border-[#2f2f2f] space-y-4 shadow-lg`}
    >
      <h3 className="text-xl font-bold text-[#e0e0e0] border-b border-gray-700 pb-2 flex items-center">
        <Icon className="h-5 w-5 mr-2 text-[#03DAC6]" /> {title}
      </h3>
      {children}
    </div>
  );

  const LinkOrFileItem = ({ item }) => {
    const isFile = item.url.includes("upload"); // Simple check, assume files need downloading
    const iconColor = isFile ? "text-orange-400" : "text-[#03DAC6]";
    const Icon = isFile ? Download : LinkIcon;

    return (
      <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors">
        <div className="flex items-center truncate">
          <Icon className={`h-4 w-4 mr-2 shrink-0 ${iconColor}`} />
          <span className="text-sm text-[#e0e0e0] truncate">{item.name}</span>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs font-semibold uppercase ml-3 py-1 px-2 rounded-full ${
            isFile
              ? "bg-orange-700/50 text-orange-200"
              : "bg-[#03DAC6]/50 text-white"
          }`}
        >
          {isFile ? "Download" : "Open Link"}
        </a>
      </div>
    );
  };

  return (
    // KEY CHANGE 1: Removed max-width and ensured component fills the content area
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700">
        {/* KEY CHANGE 2: Reduced header text size for mobile */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider">
          Submission Review
        </h1>
        {/* KEY CHANGE 3: Reduced paragraph text size for mobile */}
        <p className="text-[#bdbdbd] mt-1 text-sm sm:text-lg">
          Assignment: **{sub.assignmentId?.title || "Unknown Assignment"}**
        </p>
      </header>

      {/* Main Score and Status Area */}
      {/* KEY CHANGE 4: Grid is now 1 column on mobile, 2 on medium, and 3 on large */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Score Card - Fills full width on mobile/small tablet */}
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
                <Award className="h-5 w-5 mr-2" />{" "}
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
            </div>
          )}
        </div>

        {/* Status and Deadlines - Fills full width on mobile/small tablet */}
        <div className="sm:col-span-2">
          {" "}
          {/* This card spans the remaining width on medium screens */}
          <ReviewCard title="Status" icon={Clock}>
            {/* Status badge */}
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                sub.late
                  ? "bg-red-900/40 text-red-400 border border-red-700"
                  : "bg-green-700/30 text-green-400 border border-green-700"
              }`}
            >
              {sub.late
                ? "🚩 Your submission was marked LATE."
                : "✅ Submission received ON TIME."}
            </div>

            {/* Additional info block */}
            <div className="space-y-3 pt-2">
              <p className="text-[#bdbdbd] text-sm flex items-center">
                <Clock className="h-4 w-4 mr-2 text-[#ba68c8]" /> Submitted At:{" "}
                {new Date(sub.submittedAt).toLocaleString()}
              </p>
              <p className="text-[#bdbdbd] text-sm flex items-center">
                <UserCheck className="h-4 w-4 mr-2 text-[#ba68c8]" /> Reviewed
                By: {sub.grade?.reviewerId?.name || "N/A"}
              </p>
            </div>
          </ReviewCard>
        </div>
      </div>

      {/* Teacher Feedback and Content */}
      {/* KEY CHANGE 5: Grid is now 1 column on mobile, 2 on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <ReviewCard title="Submitted Content" icon={FileText}>
          {sub.linkOrFiles?.length > 0 ? (
            <div className="space-y-3">
              {sub.linkOrFiles.map((item, index) => (
                <LinkOrFileItem key={index} item={item} />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center bg-gray-800 rounded-lg text-[#bdbdbd]">
              No content recorded.
            </div>
          )}
        </ReviewCard>

        <ReviewCard title="Teacher Feedback" icon={MessageSquare}>
          <div className="bg-gray-800 p-4 rounded-lg min-h-[150px] border border-gray-700">
            <p className="text-[#e0e0e0] whitespace-pre-wrap">
              {isGraded && feedback
                ? feedback
                : isGraded
                ? "No written feedback provided."
                : "Feedback pending grade."}
            </p>
          </div>
        </ReviewCard>
      </div>

      {/* Comments Section (already responsive) */}
      <CommentSection submissionId={submissionId} />
    </div>
  );
};

export default StudentSubmissionReview;
