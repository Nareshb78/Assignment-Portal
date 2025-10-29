// src/components/common/JoinClassModal.jsx

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enrollInClass } from "../../redux/slices/classSlice";
import { X, KeyRound, CheckCircle } from "lucide-react";
import Loader from "./Loader";

const JoinClassModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.classes);
  const { user } = useSelector((state) => state.auth);

  const [classCode, setClassCode] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnrollmentStatus(null);
    if (!classCode.trim()) return;

    try {
      // Note: Since the student is self-enrolling, we pass the code only.
      // The backend handles finding the class by code and enrolling req.user.
      await dispatch(
        enrollInClass({
          classId: null, // Ignored by controller for self-enrollment
          enrollmentData: { code: classCode.trim() },
        })
      ).unwrap();

      setEnrollmentStatus("success");
      setClassCode("");
      // Optional: Close modal after a short delay
      setTimeout(onClose, 2000);
    } catch (err) {
      setEnrollmentStatus("error");
      // Error handling needs refinement to extract specific messages
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    // KEY CHANGE 1: Added 'p-4' to the fixed container for necessary screen padding on mobile.
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      {/* KEY CHANGE 2: Updated padding to 'p-6 sm:p-8' for smaller mobile padding.
          KEY CHANGE 3: Added 'max-h-full overflow-y-auto' for scrollability on small screens, although less likely needed for this small modal.
      */}
      <div className="bg-surface p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-[#2f2f2f] max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-6">
          {/* KEY CHANGE 4: Adjusted heading size for better mobile fit. */}
          <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8]">
            Join a Class
          </h2>
          <button
            onClick={onClose}
            className="text-[#bdbdbd] hover:text-red-400"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#ba68c8]" />
            <input
              type="text"
              placeholder="Enter Class Code (e.g., FSD101)"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              required
              className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all"
            />
          </div>

          {/* Status/Error Messages */}
          {enrollmentStatus === "success" && (
            <div className="bg-green-700/30 text-green-400 p-3 rounded-lg border border-green-700 flex items-center text-sm sm:text-base">
              <CheckCircle size={20} className="mr-2 flex-shrink-0" /> Successfully joined the
              class!
            </div>
          )}
          {enrollmentStatus === "error" && (
            <div className="bg-red-900/40 text-red-400 p-3 rounded-lg border border-red-700 text-sm sm:text-base">
              Failed to join. Code is invalid or you are already enrolled.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || enrollmentStatus === "success"}
            className="w-full bg-[#ba68c8] text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.01]"
          >
            {isLoading ? (
              <Loader size="sm" />
            ) : (
              <>
                <KeyRound className="h-5 w-5 mr-2" /> Submit Code
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinClassModal;