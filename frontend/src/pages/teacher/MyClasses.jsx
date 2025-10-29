// src/pages/teacher/MyClasses.jsx (FINAL FIX for Hooks Order)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyClasses } from '../../redux/slices/classSlice';
import { Plus, BarChart2, CheckSquare, Clock, Search, User, GraduationCap, ArrowRight, KeyRound, UserCheck } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import axios from 'axios'; 

// Define the base structure for metric state
const initialMetricsState = { 
    pendingGradeCount: '...', 
    averageScore: '...' 
};


// --- MOCK THUNK FOR DYNAMIC METRICS API CALL ---
const fetchTeacherMetrics = () => async (dispatch) => {
    try {
        const response = await axios.get('/api/assignments/metrics/teacher');
        return response.data.data; 
    } catch (e) {
        console.error("Failed fetching teacher metrics:", e.message);
        throw { pendingGradeCount: 'N/A', averageScore: 'N/A' };
    }
};


const TeacherDashboard = () => {
    // --- 1. ALL HOOKS MUST BE CALLED UNCONDITIONALLY ---
    const dispatch = useDispatch();
    const { myClasses = [], pagination = { pages: 0, total: 0 }, isLoading } = useSelector((state) => state.classes || {});
    const { user } = useSelector((state) => state.auth);
    
    // useState hooks
    const [dynamicMetrics, setDynamicMetrics] = useState(initialMetricsState); 
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    
    
    // 2. Calculate Total Student Count (Memoized hook)
    const totalStudentCount = useMemo(() => {
        return myClasses.reduce((total, classItem) => {
            const studentCount = classItem.members?.filter(m => m.roleInClass === 'student').length || 0;
            return total + studentCount;
        }, 0);
    }, [myClasses]); 


    // 3. Fetch Dashboard Metrics (useEffect hook)
    useEffect(() => {
        // We handle the promise chain here, ensuring all component state updates run.
        dispatch(fetchTeacherMetrics())
            .then(data => {
                setDynamicMetrics({
                    pendingGradeCount: data.pendingGradeCount,
                    averageScore: (typeof data.averageScore === "number" ? data.averageScore.toFixed(1) + "%" : data.averageScore)
                });
            })
            .catch(error => {
                // Failure path: This correctly uses the thrown default data structure
                setDynamicMetrics({ 
                    pendingGradeCount: error.pendingGradeCount || 'Error', 
                    averageScore: error.averageScore || 'Error' 
                });
            });
    }, [dispatch]);


    // 4. Fetch Class Data (useEffect hook)
    useEffect(() => {
        dispatch(fetchMyClasses({ 
            page: currentPage, 
            limit: 6,
            q: debouncedSearchTerm 
        }));
    }, [dispatch, currentPage, debouncedSearchTerm]);


    // 5. Debounce Search (useEffect hook)
    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);


    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // 6. CONDITIONAL RETURN MUST BE AFTER ALL HOOKS
    // if (isLoading && myClasses.length === 0) {
    //     return <Loader message="Loading your teacher dashboard..." />;
    // }

    // 7. Dynamic Metrics Array (Memoized hook)
    const dashboardStats = useMemo(() => [
        { title: "Total Classes", value: pagination.total || 0, icon: GraduationCap, color: "text-[#ba68c8]", bg: "bg-[#ba68c8]/20" },
        { title: "Total Students", value: totalStudentCount, icon: UserCheck, color: "text-blue-400", bg: "bg-blue-400/20" },
        { title: "Assignments Pending Grade", value: dynamicMetrics.pendingGradeCount, icon: CheckSquare, color: "text-yellow-400", bg: "bg-yellow-400/20" },
        { title: "Avg. Class Score", value: dynamicMetrics.averageScore, icon: BarChart2, color: "text-green-400", bg: "bg-green-400/20" },
    ], [pagination.total, totalStudentCount, dynamicMetrics]); 


    // --- UI Components ---
    const StatCard = ({ title, value, icon: Icon, color, bg }) => (
        <div 
            // KEY CHANGE 1: Used 'p-4 sm:p-6' for card padding
            className="bg-surface rounded-xl p-4 sm:p-6 border border-[#2f2f2f] flex items-center justify-between 
                        shadow-[0_0_15px_rgba(186,104,200,0.1)] transition-transform duration-300 hover:scale-[1.02]"
        >
            <div>
                {/* KEY CHANGE 2: Reduced title size */}
                <p className="text-[#bdbdbd] text-xs sm:text-sm font-medium uppercase tracking-wider">{title}</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#e0e0e0] mt-1">{value}</h2>
            </div>
            <div className={`p-3 rounded-full ${bg} shrink-0`}>
                <Icon size={24} className={color} />
            </div>
        </div>
    );

    const TeacherClassCard = ({ classData }) => (
        <div className="bg-surface rounded-xl p-6 border border-[#2f2f2f] transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_15px_rgba(186,104,200,0.1)]">
            <h3 className="text-xl font-semibold text-[#ba68c8] truncate mb-3 border-b border-gray-800 pb-2">{classData.title}</h3>
            
            {/* Class Code Display */}
            <div className="flex items-center justify-between text-base mb-4 bg-gray-800 p-2 rounded-lg border border-gray-700">
                <span className="font-semibold text-[#bdbdbd] flex items-center text-sm">
                    <KeyRound className="h-4 w-4 mr-2 text-[#03DAC6] shrink-0" /> Class Code:
                </span>
                <span className="font-extrabold text-[#e0e0e0] tracking-widest cursor-text select-all text-sm">
                    {classData.code || 'N/A'} 
                </span>
            </div>
            
            {/* Old Details - Adjusted spacing */}
            <div className="flex justify-between text-xs sm:text-sm mb-4"> {/* KEY CHANGE 3: Reduced font size */}
                <div className="flex items-center text-[#bdbdbd]">
                    <User className="h-4 w-4 mr-1 shrink-0" />
                    <span>Students: {classData.members.filter(m => m.roleInClass === 'student').length}</span>
                </div>
                <div className="text-[#bdbdbd] text-right">
                    <Clock className="h-4 w-4 inline mr-1" /> {new Date(classData.createdAt).toLocaleDateString()}
                </div>
            </div>

            {/* Action Buttons - KEY CHANGE 4: Reduced gap and padding for mobile */}
            <div className="flex gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-800">
                <Link 
                    to={`/teacher/classes/${classData._id}/assignments/create`}
                    className="flex-1 bg-[#ba68c8] text-white text-center py-2 px-3 rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center text-xs sm:text-sm font-medium"
                >
                    <Plus className="h-4 w-4 mr-1 shrink-0" /> New Assignment
                </Link>
                <Link 
                    to={`/teacher/classes/${classData._id}/assignments`}
                    className="flex-1 border border-[#ba68c8] text-[#ba68c8] text-center py-2 px-3 rounded-lg hover:bg-[#ba68c8]/10 transition-colors flex items-center justify-center text-xs sm:text-sm font-medium"
                >
                    Manage <ArrowRight className="h-4 w-4 ml-1 shrink-0" />
                </Link>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 sm:space-y-10">
            {/* KEY CHANGE 5: Reduced main header size for mobile */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider">
                Teacher Dashboard
            </h1>

            {/* Analytics Cards - KEY CHANGE 6: Changed to 2 columns on mobile, 4 on medium screens */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"> 
                {dashboardStats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Class List Header and Search - KEY CHANGE 7: Stacked header and search vertically */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-800 space-y-4 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-[#e0e0e0] mb-0">My Classes</h2>
                {/* Search Input Area - KEY CHANGE 8: Ensured search takes full width on mobile */}
                <div className="relative w-full sm:w-80">
                    <input
                        type="text"
                        placeholder="Search classes by title or code..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-10 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all placeholder-[#bdbdbd]"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#ba68c8]" />
                </div>
            </div>

            {/* Class Grid */}
            {myClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myClasses.map((classItem) => (
                        <TeacherClassCard key={classItem._id} classData={classItem} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-surface rounded-xl border border-[#2f2f2f] shadow-lg">
                    <h2 className="text-2xl font-medium text-[#e0e0e0]">No Classes Assigned</h2>
                    <p className="text-[#bdbdbd] mt-2">You have not been assigned as a teacher to any class.</p>
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

export default TeacherDashboard;