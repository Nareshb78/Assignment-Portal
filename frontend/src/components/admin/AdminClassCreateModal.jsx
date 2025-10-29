// src/components/admin/AdminClassCreateModal.jsx

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createClass } from "../../redux/slices/classSlice";
import { X, Layers, User, Plus, ChevronDown } from "lucide-react";
import Loader from "../common/Loader";

const AdminClassCreateModal = ({ isOpen, onClose, teachers }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.classes);
  const { user } = useSelector((state) => state.auth); // Current Admin user

  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    teacherId: "", // CRITICAL: Admin must select a teacher
  });
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title || !formData.code || !formData.teacherId) {
      setFormError("Title, Code, and Teacher selection are required.");
      return;
    }

    try {
      await dispatch(createClass(formData)).unwrap();

      // Success cleanup
      setFormData({ title: "", code: "", description: "", teacherId: "" });
      onClose(); // Close modal and trigger refetch in parent
    } catch (err) {
      setFormError(
        err.message || "Failed to create class. Code might be duplicated."
      );
    }
  };

  if (!isOpen) return null;

  return (
    // Make the modal container responsive: Use 'p-4' for mobile padding instead of 'p-8' on all screens.
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      {/* Set max-width on the modal content */}
      {/* Added 'max-h-full overflow-y-auto' to ensure content doesn't overflow the screen on smaller devices */}
      <div className="bg-surface p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg border border-[#2f2f2f] transform transition-all duration-300 hover:shadow-[0_0_25px_rgba(186,104,200,0.4)] max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8]">
            Create New Class
          </h2>
          <button
            onClick={onClose}
            className="text-[#bdbdbd] hover:text-red-400"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title and Code - RESPONSIVE CHANGE HERE */}
          {/* Default to 1 column, switch to 2 columns on medium screens (md) and up */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              name="title"
              placeholder="Class Title (e.g., Intro to WebDev)"
              value={formData.title}
              onChange={handleChange}
              required
              className="bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8]"
            />
            <input
              type="text"
              name="code"
              placeholder="Unique Code (e.g., FSD101)"
              // CRITICAL: Convert value to uppercase immediately
              value={formData.code.toUpperCase()}
              onChange={(e) =>
                handleChange({
                  target: { name: "code", value: e.target.value.toUpperCase() },
                })
              }
              maxLength={6} // Added good UX: restrict length to 6
              required
              className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8]"
            />
          </div>

          {/* Teacher Selection */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#bdbdbd] pointer-events-none" />
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              required
              className="w-full appearance-none bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-2.5 pl-10 pr-3 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] cursor-pointer"
            >
              <option value="" disabled>
                -- Assign Teacher --
              </option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#bdbdbd] pointer-events-none" />
          </div>

          {/* Description */}
          <textarea
            name="description"
            placeholder="Optional description..."
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-2 px-3 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8]"
          />

          {formError && (
            <div className="bg-red-900/40 text-red-400 p-3 rounded-lg border border-red-700 text-sm font-medium animate-pulse">
              {formError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#ba68c8] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-violet-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.01]"
          >
            {isLoading ? (
              <Loader size="sm" />
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" /> Create Class
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminClassCreateModal;