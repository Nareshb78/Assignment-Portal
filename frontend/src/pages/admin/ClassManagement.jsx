// src/pages/admin/ClassManagement.jsx (FINAL SYNCHRONIZATION FIX)

import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyClasses,
  updateClass,
  deleteClass,
} from "../../redux/slices/classSlice";
import { fetchUsers } from "../../redux/slices/userSlice";
import {
  UserPlus,
  Search,
  Plus,
  Trash2,
  Users,
  RefreshCw,
  Layers,
  ChevronDown,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import AdminClassCreateModal from "../../components/admin/AdminClassCreateModal";
import EnrollStudentByEmailModal from "../../components/admin/EnrollStudentByEmailModal"; // <-- NEW IMPORT

const AdminClassManagement = () => {
  const dispatch = useDispatch();

  // Safely destructur state properties
  const {
    myClasses: classes = [],
    pagination = { pages: 0, total: 0 },
    isLoading,
  } = useSelector((state) => state.classes || {});
  const { userList: allUsers = { items: [] } } = useSelector(
    (state) => state.users || {}
  );
  const teachers = allUsers.items.filter((u) => u.role === "teacher");
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data: classes and all teachers
  useEffect(() => {
    // 1. Fetch paginated classes
    dispatch(
      fetchMyClasses({
        page: currentPage,
        limit: 10,
        q: debouncedSearchTerm,
        mine: "0",
      })
    );

    // 2. Fetch all teachers
    dispatch(fetchUsers({ limit: 1000, role: "teacher" }));
  }, [dispatch, currentPage, debouncedSearchTerm, fetchTrigger]); // CRITICAL: fetchTrigger added here

  // Handler to close modal and refetch data (to show the newly created class)
  const handleEnrollModalClose = () => {
    setIsEnrollModalOpen(false);
    // Refetch current list of classes (which updates student counts)
    setFetchTrigger((p) => p + 1);
  };
  const handleModalClose = () => {
    setIsCreateModalOpen(false);

    // FIX: Increment the trigger state to force the main useEffect to run.
    setFetchTrigger((p) => p + 1);
    setCurrentPage(1); // Ensure we go back to the first page
    console.log("MODAL CLOSED: Fetch triggered via state change."); // DEBUG
  };

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTeacherChange = (classId, e) => {
    setSelectedTeacherId((prev) => ({ ...prev, [classId]: e.target.value }));
  };

  const handleReassignTeacher = async (classId) => {
    const newTeacherId = selectedTeacherId[classId];
    if (!newTeacherId) return alert("Please select a new teacher.");

    if (
      window.confirm(
        `Are you sure you want to reassign the teacher for this class?`
      )
    ) {
      try {
        await dispatch(
          updateClass({ classId, updateFields: { teacherId: newTeacherId } })
        ).unwrap();
        alert("Teacher successfully reassigned!");
        setFetchTrigger((p) => p + 1); // FORCE REFETCH
      } catch (error) {
        alert(`Reassignment failed: ${error.message || "Check console."}`);
      }
    }
  };

  const handleDeleteClass = async (classId, title) => {
    if (
      window.confirm(
        `WARNING: This will permanently delete the class "${title}" and all associated assignments and submissions. Are you absolutely sure?`
      )
    ) {
      try {
        await dispatch(deleteClass(classId)).unwrap();
        setFetchTrigger((p) => p + 1); // FORCE REFETCH
      } catch (error) {
        alert(`Deletion failed: ${error.message || "Check console."}`);
      }
    }
  };

  if (isLoading && classes.length === 0) {
    return <Loader message="Loading admin class list..." />;
  }

  // --- UI Components (ClassTable and JSX remain the same) ---

  const ClassTable = ({ classes }) => (
    // The overflow-x-auto is the primary responsiveness feature for the table
    <div className="overflow-x-auto bg-surface rounded-xl shadow-[0_0_20px_rgba(186,104,200,0.1)] border border-[#2f2f2f]">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-[#2b2b2b]">
          <tr>
            {/* KEY CHANGE 1: Reduced padding and ensured no wrapping in headers */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Title / Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Students
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Current Teacher
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Reassign Teacher
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {classes.map((c) => {
            const studentCount = c.members.filter(
              (m) => m.roleInClass === "student"
            ).length;
            const currentTeacher = teachers.find(
              (t) => t._id === c.teacherId
            ) || { name: "N/A", _id: "" };

            return (
              <tr key={c._id} className="hover:bg-[#2b2b2b] transition-colors">
                {/* KEY CHANGE 2: Reduced padding on table cells */}
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#e0e0e0]">
                  {c.title}{" "}
                  <span className="block text-xs text-[#bdbdbd] font-mono">
                    {c.code}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#e0e0e0]">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-accentSecondary flex-shrink-0" />
                    {studentCount}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#ba68c8]">
                  {/* FIX: Use populated name, falling back to local lookup if necessary */}
                  {c.teacherId?.name || currentTeacher.name}
                </td>
                {/* Reassign Teacher column has complex controls */}
                <td className="px-4 py-3 text-sm text-[#bdbdbd] space-x-1 sm:space-x-2 flex items-center">
                  <div className="relative inline-flex">
                    <select
                      value={
                        selectedTeacherId[c._id] || currentTeacher._id || ""
                      }
                      onChange={(e) => handleTeacherChange(c._id, e)}
                      // KEY CHANGE 3: Reduced width and padding on select for mobile
                      className="appearance-none bg-gray-700 border border-gray-600 text-[#e0e0e0] rounded-md py-1.5 pl-3 pr-6 sm:pr-8 focus:ring-[#ba68c8] focus:border-[#ba68c8] w-32 sm:w-40 cursor-pointer transition-all duration-200 text-xs sm:text-sm"
                    >
                      <option value="">Select New Teacher</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {/* KEY CHANGE 4: Adjusted chevron position for smaller select box */}
                    <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-[#bdbdbd] pointer-events-none" />
                  </div>
                  {/* KEY CHANGE 5: Adjusted button padding */}
                  <button
                    onClick={() => handleReassignTeacher(c._id)}
                    className="p-1 rounded-full bg-[#ba68c8] hover:bg-violet-700 transition-colors shadow-md transform hover:scale-[1.05] flex-shrink-0"
                    title="Reassign Teacher"
                  >
                    <RefreshCw className="h-4 w-4 text-white" />
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  {/* KEY CHANGE 6: Adjusted button padding */}
                  <button
                    onClick={() => handleDeleteClass(c._id, c.title)}
                    className="text-red-500 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-[#333333] flex-shrink-0"
                    title="Delete Class"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* HEADER SECTION */}
      {/* KEY CHANGE 7: Changed to flex-col on mobile, using 'md:flex-row' to restore on desktop */}
      <header className="flex flex-col md:flex-row justify-between md:items-center border-b border-gray-700 pb-4 space-y-4 md:space-y-0">
        {/* Title */}
        {/* KEY CHANGE 8: Reduced title size for mobile */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider flex items-center">
          <Layers className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-[#ba68c8]" />
          Class Management
        </h1>
        {/* Buttons - KEY CHANGE 9: Wrapped into a flex container that wraps on mobile */}
        <div className="flex gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            // KEY CHANGE 10: Reduced padding and font size for mobile
            className="border border-[#03DAC6] text-[#03DAC6] font-bold py-2 px-3 sm:py-2.5 sm:px-5 rounded-full shadow-lg hover:bg-[#03DAC6]/10 transition-all duration-300 flex items-center text-xs sm:text-sm transform hover:scale-[1.05]"
          >
            <UserPlus className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" /> Enroll Student
          </button>
          {/* CREATE NEW CLASS BUTTON */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            // KEY CHANGE 11: Reduced padding and font size for mobile
            className="bg-[#ba68c8] text-white font-bold py-2 px-3 sm:py-2.5 sm:px-5 rounded-full shadow-lg hover:bg-violet-700 transition-all duration-300 flex items-center text-xs sm:text-sm transform hover:scale-[1.05]"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" /> Create New Class
          </button>
        </div>
      </header>

      {/* Controls: Search (Already responsive) */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search classes by title or code..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-12 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all placeholder-[#bdbdbd]"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#ba68c8]" />
      </div>

      {/* Class Data Table */}
      {classes.length > 0 ? (
        <ClassTable classes={classes} />
      ) : (
        <div className="text-center py-12 bg-surface rounded-xl border border-[#2f2f2f] shadow-lg">
          <h2 className="text-2xl font-medium text-[#e0e0e0]">
            No Classes Defined
          </h2>
          <p className="text-[#bdbdbd] mt-2">
            Create a new class to begin enrollment.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modal Component Integration (already responsive from previous steps) */}
      <AdminClassCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        teachers={teachers}
      />
      <EnrollStudentByEmailModal
        isOpen={isEnrollModalOpen}
        onClose={handleEnrollModalClose}
        classes={classes} // Pass the list of all classes currently fetched
      />
    </div>
  );
};

export default AdminClassManagement;