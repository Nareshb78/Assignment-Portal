// src/pages/admin/ClassManagement.jsx (FINAL SMOOTH SYNC + LOCAL STATE FIX)
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import EnrollStudentByEmailModal from "../../components/admin/EnrollStudentByEmailModal";

const AdminClassManagement = () => {
  const dispatch = useDispatch();

  const {
    myClasses: reduxClasses = [],
    pagination = { pages: 0, total: 0 },
    isLoading,
  } = useSelector((state) => state.classes || {});
  const { userList: allUsers = { items: [] } } = useSelector(
    (state) => state.users || {}
  );

  const teachers = allUsers.items.filter((u) => u.role === "teacher");

  // Local state mirrors Redux data to prevent input flicker
  const [localClasses, setLocalClasses] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Debounce for smoother input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync redux classes into local state without remounting
  useEffect(() => {
    if (reduxClasses.length) {
      setLocalClasses(reduxClasses);
      setFetchLoading(false);
    } else if (!isLoading) {
      setLocalClasses([]);
      setFetchLoading(false);
    }
  }, [reduxClasses, isLoading]);

  // Fetch data
  useEffect(() => {
    setFetchLoading(true);
    Promise.all([
      dispatch(
        fetchMyClasses({
          page: currentPage,
          limit: 10,
          q: debouncedSearchTerm,
          mine: "0",
        })
      ),
      dispatch(fetchUsers({ limit: 1000, role: "teacher" })),
    ]).finally(() => setFetchLoading(false));
  }, [dispatch, currentPage, debouncedSearchTerm, fetchTrigger]);

  // Modals close -> refetch
  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setFetchTrigger((p) => p + 1);
    setCurrentPage(1);
  };

  const handleEnrollModalClose = () => {
    setIsEnrollModalOpen(false);
    setFetchTrigger((p) => p + 1);
  };

  const handlePageChange = useCallback((page) => setCurrentPage(page), []);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleTeacherChange = (classId, e) =>
    setSelectedTeacherId((p) => ({ ...p, [classId]: e.target.value }));

  const handleReassignTeacher = async (classId) => {
    const newTeacherId = selectedTeacherId[classId];
    if (!newTeacherId) return alert("Please select a new teacher.");
    if (!window.confirm("Reassign teacher for this class?")) return;

    try {
      await dispatch(
        updateClass({ classId, updateFields: { teacherId: newTeacherId } })
      ).unwrap();
      alert("Teacher reassigned!");
      setFetchTrigger((p) => p + 1);
    } catch (err) {
      alert(`Failed: ${err.message || "Error"}`);
    }
  };

  const handleDeleteClass = async (classId, title) => {
    if (
      window.confirm(
        `This will permanently delete "${title}" and all related data. Continue?`
      )
    ) {
      try {
        await dispatch(deleteClass(classId)).unwrap();
        setFetchTrigger((p) => p + 1);
      } catch (err) {
        alert(`Deletion failed: ${err.message || "Error"}`);
      }
    }
  };

  const ClassTable = useMemo(
    () => ({ classes }) => (
      <div className="relative overflow-x-auto bg-surface rounded-xl shadow-[0_0_20px_rgba(186,104,200,0.1)] border border-[#2f2f2f]">
        {fetchLoading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10">
            <Loader size="sm" message="Refreshing class data..." />
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-[#2b2b2b]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase whitespace-nowrap">
                Title / Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase whitespace-nowrap">
                Students
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase whitespace-nowrap">
                Current Teacher
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase whitespace-nowrap">
                Reassign Teacher
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#ba68c8] uppercase whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {classes.map((c) => {
              const studentCount = c.members.filter(
                (m) => m.roleInClass === "student"
              ).length;
              const currentTeacher =
                teachers.find((t) => t._id === c.teacherId) || {
                  name: "N/A",
                  _id: "",
                };

              return (
                <tr key={c._id} className="hover:bg-[#2b2b2b] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[#e0e0e0] whitespace-nowrap">
                    {c.title}
                    <span className="block text-xs text-[#bdbdbd] font-mono">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#e0e0e0] whitespace-nowrap">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-accentSecondary" />
                      {studentCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#ba68c8] whitespace-nowrap">
                    {c.teacherId?.name || currentTeacher.name}
                  </td>
                  <td className="px-4 py-3 flex items-center space-x-2 text-sm text-[#bdbdbd] whitespace-nowrap">
                    <div className="relative">
                      <select
                        value={
                          selectedTeacherId[c._id] ||
                          currentTeacher._id ||
                          ""
                        }
                        onChange={(e) => handleTeacherChange(c._id, e)}
                        className="bg-gray-700 border border-gray-600 text-[#e0e0e0] rounded-md py-1.5 pl-3 pr-6 focus:ring-[#ba68c8] focus:border-[#ba68c8] text-xs sm:text-sm w-36 sm:w-44"
                      >
                        <option value="">Select</option>
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bdbdbd]" />
                    </div>
                    <button
                      onClick={() => handleReassignTeacher(c._id)}
                      className="p-1 rounded-full bg-[#ba68c8] hover:bg-violet-700 transition-colors shadow-md"
                    >
                      <RefreshCw className="h-4 w-4 text-white" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteClass(c._id, c.title)}
                      className="text-red-500 hover:text-red-300 p-1 rounded-full hover:bg-[#333333]"
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
    ),
    [teachers, selectedTeacherId, fetchLoading]
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="flex flex-col md:flex-row justify-between md:items-center border-b border-gray-700 pb-4 space-y-4 md:space-y-0">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] flex items-center">
          <Layers className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-[#ba68c8]" />
          Class Management
        </h1>

        <div className="flex gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="border border-[#03DAC6] text-[#03DAC6] font-bold py-2 px-3 sm:px-5 rounded-full shadow-lg hover:bg-[#03DAC6]/10 transition-all text-xs sm:text-sm flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Enroll Student
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#ba68c8] text-white font-bold py-2 px-3 sm:px-5 rounded-full shadow-lg hover:bg-violet-700 transition-all text-xs sm:text-sm flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" /> Create New Class
          </button>
        </div>
      </header>

      <div className="relative">
        <input
          type="text"
          placeholder="Search classes by title or code..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-12 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] placeholder-[#bdbdbd]"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#ba68c8]" />
      </div>

      {localClasses.length > 0 ? (
        <ClassTable classes={localClasses} />
      ) : fetchLoading ? (
        <Loader message="Loading admin class list..." />
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

      {pagination.pages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <AdminClassCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        teachers={teachers}
      />
      <EnrollStudentByEmailModal
        isOpen={isEnrollModalOpen}
        onClose={handleEnrollModalClose}
        classes={localClasses}
      />
    </div>
  );
};

export default AdminClassManagement;
