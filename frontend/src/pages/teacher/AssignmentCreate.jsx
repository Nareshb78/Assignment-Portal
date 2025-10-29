// src/pages/teacher/AssignmentCreate.jsx (FINAL STRUCTURAL FIX)

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { createAssignment } from "../../redux/slices/assignmentSlice";
import {
  Plus,
  Clock,
  FileText,
  Upload,
  X,
  CheckSquare,
  Layers,
} from "lucide-react";

// --- 1. MOVE Input Component OUTSIDE for stable identity ---
const Input = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  icon: Icon,
}) => (
  <div className="space-y-1 relative group">
    <label htmlFor={name} className="block text-sm font-medium text-[#e0e0e0]">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {Icon && (
      <Icon className="absolute left-3 top-9 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#ba68c8] transition-colors" />
    )}
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      // KEY CHANGE 1: Used 'pl-3' instead of 'pl-10' for date inputs to fit content better on mobile,
      // but maintained 'pl-10' when an icon is present.
      className={`w-full bg-gray-800 text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2 ${
        Icon ? "pl-10" : "pl-3"
      } pr-3 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all`}
    />
  </div>
);

// --- 2. MOVE Textarea Component OUTSIDE for stable identity ---
const Textarea = ({ label, name, value, onChange }) => (
  <div className="space-y-1">
    <label htmlFor={name} className="block text-sm font-medium text-[#e0e0e0]">
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      rows="4"
      className="w-full bg-gray-800 text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2 px-3 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all"
    />
  </div>
);

// --- 3. MAIN COMPONENT (Now stable) ---
const AssignmentCreate = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.assignments);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueAt: "",
    maxScore: 100,
    attachments: [],
  });
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ... (handleAttachmentUpload, removeAttachment, handleSubmit remain the same) ...

  const handleAttachmentUpload = (e) => {
    e.preventDefault();
    // --- MOCK ATTACHMENT LOGIC ---
    const mockFile = {
      fileName: `Attachment_${formData.attachments.length + 1}.pdf`,
      url: `https://cloudstorage.com/class${classId}/file${Date.now()}.pdf`,
      fileType: "application/pdf",
    };

    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, mockFile],
    }));
    // --- END MOCK ---
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (new Date(formData.dueAt) <= new Date()) {
      setFormError("The due date must be set in the future.");
      return;
    }

    try {
      await dispatch(
        createAssignment({ classId, assignmentData: formData })
      ).unwrap();
      navigate(`/teacher/classes/${classId}/assignments`);
    } catch (err) {
      setFormError(err.message || "Failed to create assignment.");
    }
  };

  return (
    // KEY CHANGE 2: Removed max-w-4xl, relying on parent layout, but using horizontal spacing
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700">
        {/* KEY CHANGE 3: Reduced header text size for mobile and ensured content wrapping */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider flex items-start flex-col sm:flex-row">
          <Layers className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-[#ba68c8] flex-shrink-0 mb-2 sm:mb-0" />
          <span className="break-words">
            New Assignment for{" "}
            <span className="text-[#ba68c8] ml-0 sm:ml-2 font-mono">
              {classId.slice(-4)}
            </span>
          </span>
        </h1>
        {/* KEY CHANGE 4: Reduced paragraph text size for mobile */}
        <p className="text-[#bdbdbd] mt-1 text-sm sm:text-lg">
          Define the instructions, score, and deadline.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        // KEY CHANGE 5: Reduced form padding to 'p-6 sm:p-8'
        className="bg-surface p-6 sm:p-8 rounded-xl shadow-[0_0_20px_rgba(186,104,200,0.1)] space-y-6 sm:space-y-8 border border-[#2f2f2f]"
      >
        {/* Assignment Details */}
        {/* KEY CHANGE 6: Reduced sub-header text size */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8] border-b border-gray-700 pb-2 flex items-center">
          <CheckSquare className="h-6 w-6 mr-2" /> Core Details
        </h2>
        {/* KEY CHANGE 7: The grid switches from 1 column to 2 columns on medium screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Assignment Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            icon={FileText}
          />
          <Input
            label="Maximum Score"
            name="maxScore"
            type="number"
            value={formData.maxScore}
            onChange={handleChange}
            icon={CheckSquare}
          />
        </div>

        <Textarea
          label="Description / Instructions"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        {/* Deadline */}
        {/* KEY CHANGE 8: Reduced sub-header text size */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8] border-b border-gray-700 pb-2 pt-4 flex items-center">
          <Clock className="h-6 w-6 mr-2" /> Deadline & Timing
        </h2>
        <Input
          label="Due Date and Time"
          name="dueAt"
          type="datetime-local"
          value={formData.dueAt}
          onChange={handleChange}
          required
          icon={Clock}
        />

        {/* Attachments */}
        {/* KEY CHANGE 9: Reduced sub-header text size */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8] border-b border-gray-700 pb-2 pt-4 flex items-center">
          <FileText className="h-6 w-6 mr-2" /> Attachments
        </h2>
        {/* KEY CHANGE 10: Ensures items wrap vertically on mobile (flex-col) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            type="button"
            onClick={handleAttachmentUpload}
            className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center shadow-md text-sm transform hover:scale-[1.02] flex-shrink-0"
          >
            <Upload className="h-5 w-5 mr-2" /> Mock Upload File
          </button>
          <span className="text-xs sm:text-sm text-[#bdbdbd]">
            (Metadata will be stored, actual upload mocked)
          </span>
        </div>

        {/* Attached Files List */}
        {formData.attachments.length > 0 && (
          // KEY CHANGE 11: Added w-full to ensure list takes full width
          <div className="space-y-2 pt-2 p-4 bg-gray-800 rounded-lg border border-gray-700 w-full">
            {formData.attachments.map((file, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-surface p-3 rounded-md border border-gray-600"
              >
                <span className="text-[#e0e0e0] text-sm truncate">
                  {file.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-gray-700 flex-shrink-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error/Loading */}
        {(formError || error) && (
          <div className="bg-red-900/40 text-red-400 p-3 rounded-lg border border-red-700 text-sm font-medium animate-pulse">
            {formError || error?.message || "An error occurred."}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#ba68c8] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-violet-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.01]"
        >
          {isLoading ? (
            "Creating..."
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Create Assignment
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AssignmentCreate;
