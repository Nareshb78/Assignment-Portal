// src/components/teacher/TeacherRosterModal.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  Users,
  Trash2,
  GraduationCap,
  UserX,
  ChevronDown,
} from "lucide-react";
import { fetchClassById, removeMember } from "../../redux/slices/classSlice";
import Loader from "../common/Loader";

const TeacherRosterModal = ({ isOpen, onClose, classId, classTitle }) => {
  // --- 1. HOOKS CALLS AND DEFENSIVE SELECTION ---
  const dispatch = useDispatch();

  // FIX: Select the base state, and ensure it defaults to an object with an empty members array
  // if Redux returns null (i.e., when fetching selectedClass fails or resets).
  const { selectedClass = { members: [] }, isLoading } = useSelector(
    (state) => state.classes
  );

  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(null);

  // Fetch class details (Hook)
  useEffect(() => {
    // Only fetch if modal is open AND the class is not already fully loaded
    if (isOpen && classId && selectedClass?._id !== classId) {
      dispatch(fetchClassById(classId));
    }
    if (!isOpen) {
      setRemoveError(null);
    }
  }, [isOpen, classId, dispatch, selectedClass?._id]);

  // UseMemo to safely derive the data structure used for rendering
  const { students, classCode } = useMemo(() => {
    const members = selectedClass?.members || [];
    return {
      students: members.filter((m) => m.roleInClass === "student"),
      classCode: selectedClass?.code || classTitle,
    };
  }, [selectedClass, classTitle]); // Dependency on selectedClass is stable

  // Check if loading state should show general loader
  // Show loader if fetching OR if we opened the modal and data is still stale/empty
  const isFetching = isLoading || (!selectedClass?._id && isOpen);
  // ----------------------------------------------------------------------

  const handleRemoveStudent = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${userName} from this class?`
      )
    ) {
      return;
    }

    setIsRemoving(true);
    setRemoveError(null);
    try {
      await dispatch(
        removeMember({ classId: classId, userIdToRemove: userId })
      ).unwrap();

      alert(`${userName} has been successfully removed.`);

      dispatch(fetchClassById(classId));
    } catch (error) {
      setRemoveError(error.message || "Failed to remove student.");
    } finally {
      setIsRemoving(false);
    }
  };

  // --- 2. CONDITIONAL RENDER (Exit) MUST BE AFTER ALL HOOKS ---
  if (!isOpen) return null;

  return (
    // KEY CHANGE 1: Added 'p-4' for mobile screen padding
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      {/* KEY CHANGE 2: Reduced padding to 'p-6 sm:p-8' for better mobile fit.
          The max-h and overflow are already correctly applied. */}
      <div className="bg-surface p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-[#2f2f2f] max-h-full sm:max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-gray-700 pb-3 mb-6">
          {/* KEY CHANGE 3: Reduced font size on mobile and ensured text wrapping with 'break-words' */}
          <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8] flex items-start break-words pr-4">
            <Users size={24} className="mr-2 flex-shrink-0" /> Roster for:{" "}
            <span className="ml-1">{classTitle}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-[#bdbdbd] hover:text-red-400 flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Class Code Display */}
        {/* Ensured content stays on one line with 'whitespace-nowrap' and uses smaller padding 'p-2' */}
        <div className="flex items-center justify-between text-sm sm:text-base mb-6 bg-gray-800 p-2 rounded-lg border border-gray-700 whitespace-nowrap">
          <span className="font-semibold text-[#bdbdbd] flex items-center">
            <ChevronDown
              size={16}
              className="mr-2 text-yellow-400 flex-shrink-0"
            />{" "}
            Class Code:
          </span>
          <span className="font-extrabold text-[#e0e0e0] tracking-widest cursor-text select-all ml-4">
            {classCode}
          </span>
        </div>

        {/* Status and Loading */}
        {isFetching || isRemoving ? (
          <Loader
            message={
              isRemoving ? "Removing member..." : "Loading class roster..."
            }
          />
        ) : removeError ? (
          <div className="bg-red-900/40 text-red-400 p-3 rounded-lg border border-red-700 text-sm font-medium mb-4">
            {removeError}
          </div>
        ) : (
          <>
            <p className="text-sm text-[#bdbdbd] mb-4">
              Total Students: **{students.length}**
            </p>

            {/* Student List Table */}
            {/* The overflow-x-auto is the key responsiveness feature here. */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-[#2b2b2b]">
                  <tr>
                    {/* KEY CHANGE 4: Applied whitespace-nowrap and slightly reduced padding on table headers for compactness */}
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#ba68c8] whitespace-nowrap">
                      Student Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#ba68c8] whitespace-nowrap">
                      Role in Class
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[#ba68c8] whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {students.map((member) => {
                    // member.userId is a populated object from the backend fix
                    const userName =
                      member.userId?.name || member.userId || "ID Missing";

                    return (
                      <tr key={member.userId} className="hover:bg-[#2b2b2b]">
                        {/* KEY CHANGE 5: Reduced padding on table cells */}
                        <td className="px-3 py-3 text-sm text-[#e0e0e0] flex items-center whitespace-nowrap">
                          <GraduationCap
                            size={16}
                            className="mr-2 text-accentSecondary flex-shrink-0"
                          />
                          {userName}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#bdbdbd] whitespace-nowrap">
                          {member.roleInClass}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleRemoveStudent(
                                member.userId._id.toString(),
                                userName
                              )
                            }
                            className="text-red-500 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-gray-700"
                            title={`Remove ${userName}`}
                            disabled={isRemoving}
                          >
                            <UserX size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="text-center p-4 text-[#bdbdbd] italic text-sm">
                  This class has no students yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherRosterModal;
