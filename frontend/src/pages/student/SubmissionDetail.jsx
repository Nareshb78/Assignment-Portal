// src/pages/student/SubmissionDetail.jsx (STABLE VERSION – Consistent Loader + Input Stability)

import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  clearSelectedSubmission,
  submitAssignmentWork,
} from "../../redux/slices/submissionSlice";
import {
  Clock,
  Link as LinkIcon,
  Download,
  Award,
  FileText,
  MessageSquare,
  UserCheck,
  Upload,
  Send,
  Zap,
} from "lucide-react";
import Loader from "../../components/common/Loader";
import CommentSection from "../../components/common/CommentSection";

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

  const [localSubmission, setLocalSubmission] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [submissionLink, setSubmissionLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(null);

  // --- Fetch existing submission ---
  const fetchStudentSubmission = useCallback(async () => {
    if (!assignmentId) return;
    setFetchLoading(true);
    try {
      const { data } = await axios.get(
        `/api/submissions/by-assignment/${assignmentId}`
      );
      setLocalSubmission(data.submission);
      setFetchError(null);
    } catch (err) {
      setFetchError(
        err.response?.data?.message || "No submission record found."
      );
      setLocalSubmission(null);
    } finally {
      setFetchLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchStudentSubmission();
    return () => dispatch(clearSelectedSubmission());
  }, [fetchStudentSubmission, dispatch]);

  // --- Submit new work ---
  const handleSubmission = async (e) => {
    e.preventDefault();
    if (!submissionLink.trim()) return;

    setIsSubmitting(true);
    setFormStatus(null);

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
      const assignmentInfo =
        localSubmission?.assignmentId || NEW_SUBMISSION_MOCK_ASSIGNMENT;

      setLocalSubmission({ ...result, assignmentId: assignmentInfo });
      setFormStatus({
        type: "success",
        message: "Submission successful! Status updated.",
      });
      setFetchError(null);
    } catch (err) {
      setFormStatus({
        type: "error",
        message: err?.message || "Submission failed. Try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Loading inline, not page replacement ---
  if (fetchLoading && !localSubmission && !fetchError) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader message="Loading your submission..." />
      </div>
    );
  }

  const sub = localSubmission;
  const assignmentInfo =
    localSubmission?.assignmentId || NEW_SUBMISSION_MOCK_ASSIGNMENT;

  // --- Submission form ---
  if (!sub) {
    return (
      <div className="space-y-8 sm:space-y-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#03DAC6] tracking-wider">
          Submit: {assignmentInfo.title}
        </h1>
        <p className="text-[#bdbdbd] text-sm sm:text-lg">
          Due: {new Date(assignmentInfo.dueAt).toLocaleString()}
        </p>

        <form
          onSubmit={handleSubmission}
          className="bg-surface p-6 sm:p-8 rounded-xl border border-gray-700 space-y-5 shadow-lg"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8] flex items-center mb-4">
            <Upload className="h-6 w-6 mr-3" /> Submit Assignment Link
          </h2>

          {formStatus && (
            <div
              className={`p-3 rounded-lg border text-sm ${
                formStatus.type === "success"
                  ? "bg-green-700/30 text-green-400 border-green-700"
                  : "bg-red-900/40 text-red-400 border-red-700"
              }`}
            >
              {formStatus.message}
            </div>
          )}

          <input
            type="url"
            placeholder="Paste GitHub or Drive link"
            value={submissionLink}
            onChange={(e) => setSubmissionLink(e.target.value)}
            disabled={isSubmitting}
            className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all placeholder-[#bdbdbd]"
          />

          <button
            type="submit"
            disabled={isSubmitting || submissionLink.length < 5}
            className="w-full bg-[#03DAC6] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-teal-600 transition-all disabled:bg-gray-600 flex items-center justify-center transform hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <Loader size="sm" />
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" /> Submit Work
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

  // --- Review section ---
  const isGraded = sub.status === "graded";
  const score = sub.grade?.score ?? null;
  const feedback = sub.grade?.feedback ?? "";
  const maxScore = sub.assignmentId?.maxScore || 100;
  const gradePercentage = isGraded
    ? Math.round((score / maxScore) * 100)
    : null;

  const LinkOrFileItem = ({ item }) => {
    const isLink = item.contentType === "text/uri";
    const Icon = isLink ? LinkIcon : Download;
    const color = isLink ? "text-[#ba68c8]" : "text-[#03DAC6]";

    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition border border-gray-700"
      >
        <span className="flex items-center text-[#e0e0e0] font-medium truncate">
          <Icon className={`h-5 w-5 mr-3 ${color}`} />
          {item.fileName || (isLink ? "Submitted Link" : "Uploaded File")}
        </span>
        <span className="text-xs text-[#bdbdbd] uppercase">
          {isLink ? "VIEW" : "DOWNLOAD"}
        </span>
      </a>
    );
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0]">
          Submission Review
        </h1>
        <p className="text-[#bdbdbd] mt-1 text-sm sm:text-lg">
          Assignment: {sub.assignmentId?.title || "Unknown"}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-gray-700 shadow">
          <h3 className="text-xl font-bold text-[#ba68c8] border-b border-gray-700 pb-2">
            Final Grade
          </h3>
          {isGraded ? (
            <div className="text-center pt-4">
              <p className="text-6xl font-extrabold text-[#ba68c8]">{score}</p>
              <p className="text-[#bdbdbd] text-lg">of {maxScore}</p>
              <div className="flex justify-center items-center mt-3 bg-[#03DAC6]/20 text-[#03DAC6] p-1.5 rounded-full">
                <Award className="h-5 w-5 mr-2" />
                {gradePercentage}% Achieved
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Zap className="h-10 w-10 mx-auto text-yellow-400 animate-pulse" />
              <p className="text-yellow-400 font-semibold mt-3">
                Awaiting Grade
              </p>
            </div>
          )}
        </div>

        <div className="col-span-1 sm:col-span-2 bg-surface p-6 rounded-xl border border-[#2f2f2f] space-y-4 shadow">
          <h3 className="text-xl font-bold text-[#e0e0e0] border-b border-gray-700 pb-2 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-[#03DAC6]" /> Timeline
          </h3>
          <div className="space-y-3 text-[#bdbdbd] text-sm">
            <p>
              <strong>Submitted:</strong>{" "}
              {new Date(sub.submittedAt).toLocaleString()}
            </p>
            <p>
              <strong>Reviewed:</strong>{" "}
              {isGraded ? new Date(sub.grade.gradedAt).toLocaleString() : "N/A"}
            </p>
            <p
              className={`font-medium ${
                sub.late ? "text-red-400" : "text-green-400"
              }`}
            >
              {sub.late
                ? "🚩 Submitted Late"
                : "✅ Submitted On Time"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-surface p-6 rounded-xl border border-[#2f2f2f] space-y-4 shadow">
          <h3 className="text-xl font-bold text-[#e0e0e0] border-b border-gray-700 pb-2 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-[#03DAC6]" /> Submitted
            Files/Links
          </h3>
          {sub.linkOrFiles?.length > 0 ? (
            <div className="space-y-3">
              {sub.linkOrFiles.map((item, i) => (
                <LinkOrFileItem key={i} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-[#bdbdbd] text-center bg-gray-800 p-4 rounded-lg">
              No files or links submitted.
            </p>
          )}
        </div>

        <div className="bg-surface p-6 rounded-xl border border-[#2f2f2f] space-y-4 shadow">
          <h3 className="text-xl font-bold text-[#e0e0e0] border-b border-gray-700 pb-2 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-[#03DAC6]" /> Teacher
            Feedback
          </h3>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[120px]">
            <p className="text-[#e0e0e0] whitespace-pre-wrap">
              {isGraded && feedback
                ? feedback
                : isGraded
                ? "No feedback provided."
                : "Awaiting grading..."}
            </p>
          </div>
        </div>
      </div>

      <CommentSection submissionId={sub._id} />
    </div>
  );
};

export default StudentSubmissionDetail;
