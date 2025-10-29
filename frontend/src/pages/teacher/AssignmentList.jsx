// src/pages/teacher/AssignmentList.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { fetchAssignments } from "../../redux/slices/assignmentSlice";
import {
  Search,
  Plus,
  Clock,
  Filter,
  ListOrdered,
  ArrowRight,
  XCircle,
  ChevronDown,
  CheckCircle,
  Users,
  Edit2,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import TeacherRosterModal from "../../components/teacher/TeacherRosterModal";

const filterOptions = [
  { value: "", label: "All Assignments" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
];

const AssignmentList = () => {
  const { classId } = useParams();
  const dispatch = useDispatch();

  // Select state for filtering and display
  const assignmentsBaseState = useSelector((state) => state.assignments);
  const classesState = useSelector((state) => state.classes);

  // Safety for the local component
  // We try to find the current class details from the list stored in Redux
  const currentClass = classesState.myClasses.find(
    (c) => c._id === classId
  ) || { title: "Loading Class", code: "" };
  const classTitle = currentClass.title || "Loading Class";

  // Memoization logic for assignment list data
  const { assignments, pagination, isLoading } = useMemo(() => {
    const assignmentState =
      assignmentsBaseState.assignmentsByClass[classId] || {};

    return {
      assignments: assignmentState.items || [],
      pagination: assignmentState.pagination || { pages: 0 },
      isLoading: assignmentsBaseState.isLoading,
    };
  }, [assignmentsBaseState, classId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data whenever filters/page change
  useEffect(() => {
    dispatch(
      fetchAssignments({
        classId,
        page: currentPage,
        limit: 10,
        q: debouncedSearchTerm,
        statusFilter,
      })
    );
  }, [dispatch, classId, currentPage, debouncedSearchTerm, statusFilter]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRosterClose = () => {
    setIsRosterModalOpen(false);
    // Note: You might need to dispatch fetchClassById here to refresh student counts after removal
  };

  // --- UI Components ---

  const getStatusBadge = (dueAt) => {
    const isOverdue = new Date(dueAt) < new Date();
    // Using explicit colors for consistency with previous components
    const style = isOverdue
      ? "bg-red-700 text-white"
      : "bg-green-700/30 text-green-400";
    const text = isOverdue ? "OVERDUE" : "ACTIVE";
    const Icon = isOverdue ? XCircle : CheckCircle;

    return (
      <span
        // KEY CHANGE 1: Reduced padding for compactness
        className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${style} flex items-center whitespace-nowrap`}
      >
        <Icon className="h-3 w-3 mr-1 flex-shrink-0" /> {text}
      </span>
    );
  };

  const AssignmentTable = ({ assignments }) => (
    <div className="overflow-x-auto bg-surface rounded-xl shadow-lg border border-[#2f2f2f]">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-[#2b2b2b]">
          <tr>
            {/* KEY CHANGE 2: Reduced padding and added whitespace-nowrap to headers */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Assignment
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Due Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {assignments.map((assignment) => (
            <tr
              key={assignment._id}
              className="hover:bg-[#2b2b2b] transition-colors"
            >
              {/* KEY CHANGE 3: Reduced padding on all table cells */}
              <td className="px-4 py-3 text-sm font-medium text-[#e0e0e0] max-w-[200px] truncate">
                {assignment.title}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#bdbdbd]">
                {/* Used toLocaleDateString for mobile friendliness */}
                {new Date(assignment.dueAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {getStatusBadge(assignment.dueAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2 sm:gap-3 items-center">
                {/* Link to Edit Assignment */}
                <Link
                  to={`/teacher/classes/${classId}/assignments/create?edit=${assignment._id}`} // Mock Edit Route
                  className="text-yellow-400 hover:text-yellow-300 transition-colors p-1 rounded-full hover:bg-[#333333] flex-shrink-0"
                  title="Edit Assignment"
                >
                  <Edit2 className="h-5 w-5" />
                </Link>

                {/* Link to Submissions Queue */}
                <Link
                  to={`/teacher/classes/${classId}/assignments/${assignment._id}/submissions`}
                  // KEY CHANGE 4: Reduced font size and icon size for mobile
                  className="text-[#ba68c8] hover:text-[#03DAC6] transition-colors flex items-center justify-end font-semibold transform hover:scale-105 text-xs sm:text-sm"
                >
                  Review Submissions <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        {/* KEY CHANGE 5: Reduced header text size for mobile */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider">
          Assignments for <span className="text-[#ba68c8]">{classTitle}</span>
        </h1>

        {/* Roster and Create Buttons - KEY CHANGE 6: Ensured buttons wrap and use smaller padding */}
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          {/* 1. VIEW ROSTER BUTTON */}
          <button
            onClick={() => setIsRosterModalOpen(true)}
            // KEY CHANGE 7: Reduced padding and text size for mobile
            className="border border-yellow-400 text-yellow-400 py-2 px-3 sm:py-2.5 sm:px-6 rounded-full shadow-md hover:bg-yellow-400/10 transition-all duration-300 flex items-center transform hover:scale-[1.05] text-sm flex-shrink-0"
          >
            <Users className="h-4 w-4 mr-1 sm:mr-2" /> View Roster
          </button>

          {/* 2. CREATE NEW ASSIGNMENT BUTTON */}
          <Link
            to={`/teacher/classes/${classId}/assignments/create`}
            // KEY CHANGE 8: Reduced padding and text size for mobile
            className="bg-[#ba68c8] text-white font-bold py-2 px-3 sm:py-2.5 sm:px-6 rounded-full shadow-lg hover:bg-violet-700 transition-all duration-300 flex items-center transform hover:scale-105 text-sm flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" /> Create New
          </Link>
        </div>
      </header>

      {/* Controls: Search and Filter - KEY CHANGE 9: Ensures controls stack on mobile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-grow w-full"> {/* Added w-full */}
          <input
            type="text"
            placeholder="Search assignments by title..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-12 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all placeholder-[#bdbdbd]"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#ba68c8]" />
        </div>

        {/* Filter */}
        <div className="relative w-full md:w-48 flex-shrink-0"> {/* Added w-full on filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full appearance-none bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-10 pr-8 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all cursor-pointer"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#ba68c8] pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#bdbdbd] pointer-events-none" />
        </div>
      </div>

      {/* Assignment Table */}
      {isLoading ? (
        <Loader message="Loading assignments..." />
      ) : assignments.length > 0 ? (
        <AssignmentTable assignments={assignments} />
      ) : (
        <div className="text-center py-12 bg-surface rounded-xl border border-[#2f2f2f] shadow-lg">
          <h2 className="text-2xl font-medium text-[#e0e0e0]">
            No Assignments Found
          </h2>
          <p className="text-[#bdbdbd] mt-2">
            Create the first assignment to get started.
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

      {/* Modal Integration (already responsive from previous steps) */}
      <TeacherRosterModal
        isOpen={isRosterModalOpen}
        onClose={handleRosterClose}
        classId={classId}
        classTitle={classTitle}
      />
    </div>
  );
};

export default AssignmentList;