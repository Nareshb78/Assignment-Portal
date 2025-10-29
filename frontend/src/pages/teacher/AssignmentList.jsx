// src/pages/teacher/AssignmentList.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { fetchAssignments } from "../../redux/slices/assignmentSlice";
import {
  Search,
  Plus,
  Filter,
  ArrowRight,
  XCircle,
  CheckCircle,
  ChevronDown,
  Users,
  Edit2,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import TeacherRosterModal from "../../components/teacher/TeacherRosterModal";

const FILTERS = [
  { value: "", label: "All Assignments" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
];

const AssignmentList = () => {
  const { classId } = useParams();
  const dispatch = useDispatch();

  const { assignmentsByClass, isLoading } = useSelector(
    (state) => state.assignments
  );
  const { myClasses } = useSelector((state) => state.classes);

  const currentClass = myClasses.find((c) => c._id === classId) || {};
  const { title: classTitle = "Loading Class" } = currentClass;

  const assignmentState = assignmentsByClass[classId] || {};
  const assignments = assignmentState.items || [];
  const pagination = assignmentState.pagination || { pages: 0 };

  // ---------------- Local State ----------------
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  // ---------------- Effects ----------------
  useEffect(() => {
    const delay = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    dispatch(
      fetchAssignments({
        classId,
        page: currentPage,
        limit: 10,
        q: debouncedSearch,
        statusFilter: status,
      })
    );
  }, [dispatch, classId, currentPage, debouncedSearch, status]);

  // ---------------- Handlers ----------------
  const handlePageChange = useCallback((page) => setCurrentPage(page), []);
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // ---------------- UI Helpers ----------------
  const StatusBadge = ({ dueAt }) => {
    const overdue = new Date(dueAt) < new Date();
    const style = overdue
      ? "bg-red-700 text-white"
      : "bg-green-700/30 text-green-400";
    const Icon = overdue ? XCircle : CheckCircle;

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${style} flex items-center whitespace-nowrap`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {overdue ? "OVERDUE" : "ACTIVE"}
      </span>
    );
  };

  const AssignmentTable = ({ data }) => (
    <div className="overflow-x-auto bg-surface rounded-xl shadow-lg border border-[#2f2f2f]">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-[#2b2b2b]">
          <tr>
            {["Assignment", "Due Date", "Status", "Actions"].map((head) => (
              <th
                key={head}
                className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {data.map((a) => (
            <tr key={a._id} className="hover:bg-[#2b2b2b] transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-[#e0e0e0] max-w-[200px] truncate">
                {a.title}
              </td>
              <td className="px-4 py-3 text-xs sm:text-sm text-[#bdbdbd] whitespace-nowrap">
                {new Date(a.dueAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge dueAt={a.dueAt} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right flex justify-end gap-2 items-center">
                <Link
                  to={`/teacher/classes/${classId}/assignments/create?edit=${a._id}`}
                  className="text-yellow-400 hover:text-yellow-300 p-1 rounded-full hover:bg-[#333333]"
                  title="Edit Assignment"
                >
                  <Edit2 className="h-5 w-5" />
                </Link>
                <Link
                  to={`/teacher/classes/${classId}/assignments/${a._id}/submissions`}
                  className="text-[#ba68c8] hover:text-[#03DAC6] flex items-center text-xs sm:text-sm font-semibold transform hover:scale-105"
                >
                  Review <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ---------------- Render ----------------
  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0]">
          Assignments for{" "}
          <span className="text-[#ba68c8]">{classTitle}</span>
        </h1>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setIsRosterOpen(true)}
            className="border border-yellow-400 text-yellow-400 py-2 px-3 sm:px-6 rounded-full hover:bg-yellow-400/10 text-sm flex items-center"
          >
            <Users className="h-4 w-4 mr-2" /> View Roster
          </button>
          <Link
            to={`/teacher/classes/${classId}/assignments/create`}
            className="bg-[#ba68c8] text-white font-bold py-2 px-3 sm:px-6 rounded-full hover:bg-violet-700 text-sm flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" /> Create New
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search assignments..."
            className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-12 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] placeholder-[#bdbdbd]"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#ba68c8]" />
        </div>

        <div className="relative w-full md:w-48">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-10 pr-8 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8]"
          >
            {FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#ba68c8]" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bdbdbd]" />
        </div>
      </div>

      {/* Table / Loader */}
      {isLoading ? (
        <Loader message="Loading assignments..." />
      ) : assignments.length ? (
        <AssignmentTable data={assignments} />
      ) : (
        <div className="text-center py-12 bg-surface rounded-xl border border-[#2f2f2f]">
          <h2 className="text-2xl text-[#e0e0e0]">No Assignments Found</h2>
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

      {/* Roster Modal */}
      <TeacherRosterModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        classId={classId}
        classTitle={classTitle}
      />
    </div>
  );
};

export default AssignmentList;
