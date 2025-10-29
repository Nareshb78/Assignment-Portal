// src/pages/student/StudentAssignmentList.jsx (FINAL FIX for Input Stability)

import React, { useEffect, useState, useCallback, useMemo } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchAssignments } from '../../redux/slices/assignmentSlice';
import { Search, Clock, Filter, ListOrdered, FileText, CheckCircle, XCircle, Download, ChevronDown } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';

const filterOptions = [
    { value: '', label: 'All Assignments' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'overdue', label: 'Overdue' }
];

const StudentAssignmentList = () => {
    const { classId } = useParams();
    const dispatch = useDispatch();
    
    // 1. Select the base assignments state
    const assignmentsBaseState = useSelector((state) => state.assignments);
    
    // 2. MEMOIZE THE DERIVED STATE
    const { assignments, pagination, isLoading } = useMemo(() => {
        const assignmentState = assignmentsBaseState.assignmentsByClass[classId] || {};
        
        return {
            assignments: assignmentState.items || [],
            pagination: assignmentState.pagination || { pages: 0 },
            isLoading: assignmentsBaseState.isLoading
        };
    }, [assignmentsBaseState, classId]);

    const classTitle = "FSD 101 - Your Class"; // Mock Title

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // --- Debounce Logic (Kept separate) ---
    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // --- Page Reset Logic (CRITICAL FIX) ---
    // Resets page 1 whenever the search term stabilizes or a filter changes
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [debouncedSearchTerm, statusFilter]);

    // Fetch data whenever filters/page change
    useEffect(() => {
        dispatch(fetchAssignments({ 
            classId,
            page: currentPage, 
            limit: 10,
            q: debouncedSearchTerm,
            statusFilter
        }));
    }, [dispatch, classId, currentPage, debouncedSearchTerm, statusFilter]);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // FIX: This handler ONLY updates the search term, preventing render collision
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        // REMOVED: setCurrentPage(1);
    };

    if (isLoading && assignments.length === 0) {
        return <Loader message="Loading assignments..." />;
    }

    // --- UI Components ---
    
    const getStatusBadge = (dueAt) => {
        const isOverdue = new Date(dueAt) < new Date();
        const style = isOverdue ? 'bg-red-700 text-white' : 'bg-[#03DAC6]/30 text-[#03DAC6]';
        const text = isOverdue ? 'OVERDUE' : 'ACTIVE';
        const Icon = isOverdue ? XCircle : CheckCircle;

        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${style} flex items-center whitespace-nowrap`}>
                <Icon className='h-3 w-3 mr-1 shrink-0'/> {text}
            </span>
        );
    };

    const AssignmentTable = ({ assignments }) => (
        <div className="overflow-x-auto bg-surface rounded-xl shadow-lg border border-[#2f2f2f]">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-[#2b2b2b]">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">Assignment</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {assignments.map((assignment) => (
                        <tr key={assignment._id} className="hover:bg-[#2b2b2b] transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-[#e0e0e0] max-w-[200px] truncate">
                                {assignment.title}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#bdbdbd]">
                                {new Date(assignment.dueAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                {getStatusBadge(assignment.dueAt)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                {/* Link to the submission page (where student submits work) */}
                                <Link
                                    to={`/student/assignments/${assignment._id}/submit`} 
                                    className="text-[#03DAC6] hover:text-[#ba68c8] transition-colors flex items-center justify-end font-semibold transform hover:scale-105 text-xs sm:text-sm"
                                >
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0"/> View/Submit
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
            <header className="pb-4 border-b border-gray-700">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider">
                    Assignments for <span className="text-[#03DAC6]">{classTitle}</span>
                </h1>
                <p className="text-[#bdbdbd] mt-1 text-sm sm:text-lg flex items-center"><ListOrdered className='h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#ba68c8]'/> Browse available assignments.</p>
            </header>

            {/* Controls: Search */}
            <div className="relative grow">
                <input
                    type="text"
                    placeholder="Search assignments by title..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-12 pr-4 focus:ring-1 focus:ring-[#03DAC6]/50 focus:border-[#03DAC6] transition-all placeholder-[#bdbdbd]"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#03DAC6]" />
            </div>

            {/* Controls: Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Filter */}
                <div className="relative w-full md:w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full appearance-none bg-[#1e1e1e] text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-10 pr-8 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all cursor-pointer"
                    >
                        {filterOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                <div className="text-center py-12 bg-[#1e1e1e] rounded-xl border border-[#2f2f2f] shadow-lg">
                    <h2 className="text-2xl font-medium text-[#e0e0e0]">No Assignments Found</h2>
                    <p className="text-[#bdbdbd] mt-2">Check back later or contact your teacher.</p>
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
        </div>
    );
};

export default StudentAssignmentList;