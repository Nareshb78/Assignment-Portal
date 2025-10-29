// src/pages/student/MyClasses.jsx (FINAL FIX for Input Stability)

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyClasses } from '../../redux/slices/classSlice';
import { UserPlus ,Book, Search, User, Grid2X2, BookMarked, Layers } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import JoinClassModal from '../../components/common/JoinClassModal';

const MyClasses = () => {
    const dispatch = useDispatch();
    // Safely destructur state properties
    const { myClasses = [], pagination = { pages: 0, total: 0 }, isLoading } = useSelector((state) => state.classes || {});
    const { user } = useSelector((state) => state.auth);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- 1. Debounce Search Input (Updates API query term) ---
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // --- 2. Separate Effect to Reset Page (CRITICAL for fixing focus loss) ---
    // This runs AFTER debouncedSearchTerm updates. If the search term changed, it resets the page to 1.
    useEffect(() => {
        // Only reset the page if we detect a new search term has stabilized AND the current page is not 1.
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [debouncedSearchTerm]); 


    // --- 3. Main Data Fetch ---
    useEffect(() => {
        dispatch(fetchMyClasses({ 
            page: currentPage, 
            limit: 8, 
            q: debouncedSearchTerm 
        }));
    }, [dispatch, currentPage, debouncedSearchTerm]);

    // --- Handlers ---
    
    // FIX: This handler only updates the search term, preventing a render collision with setCurrentPage.
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        // Refetch data immediately after modal closes (uses existing currentPage/debouncedSearchTerm state)
        dispatch(fetchMyClasses({ 
            page: currentPage, 
            limit: 8, 
            q: debouncedSearchTerm 
        }));
    };
    
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    if (isLoading && myClasses.length === 0) {
        return <Loader message="Loading your classes..." />;
    }

    // --- UI Components ---

    const ClassCard = ({ classData }) => {
        return (
            <Link 
                to={`/student/classes/${classData._id}/assignments`}
                className="block bg-surface rounded-xl p-6 border border-[#2f2f2f] transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_15px_rgba(3,218,198,0.1)] hover:shadow-[0_0_25px_rgba(3,218,198,0.2)]"
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-[#e0e0e0] truncate">{classData.title}</h3>
                    <Layers className="h-6 w-6 text-[#03DAC6]" />
                </div>
                <p className="text-[#bdbdbd] text-sm mb-4 line-clamp-2">{classData.description || 'No description provided.'}</p>
                
                <div className="space-y-1 pt-2 border-t border-gray-800">
                    <div className="flex items-center text-sm text-[#bdbdbd]">
                        <Book className="h-4 w-4 mr-2 text-[#03DAC6]" />
                        <span className="font-medium">Code: {classData.code}</span>
                    </div>

                    <div className="flex items-center text-sm text-[#bdbdbd]">
                        <User className="h-4 w-4 mr-2 text-[#03DAC6]" />
                        <span className="font-medium">Teacher: {classData.teacherId?.name || 'N/A'}</span>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="space-y-8 sm:space-y-10">
            {/* HEADER SECTION */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-700 pb-4 space-y-4 md:space-y-0">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wide">
                    Welcome back, <span className="text-[#03DAC6]">{user?.name}!</span> 👋
                </h1>
                
                <div className='flex gap-2 sm:gap-4 flex-wrap'>
                    {/* Join Class Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="border border-[#ba68c8] text-[#ba68c8] py-2 px-3 sm:py-2.5 sm:px-6 rounded-full shadow-lg hover:bg-[#ba68c8]/10 transition-all duration-300 flex items-center font-medium transform hover:scale-[1.05] text-sm shrink-0"
                    >
                        <UserPlus className="h-4 w-4 mr-1 sm:mr-2" /> <span className='hidden sm:inline'>Join Class</span>
                    </button>

                    {/* My Submissions Button */}
                    <Link 
                        to="/student/submissions/me" 
                        className="bg-[#03DAC6] text-white py-2 px-3 sm:py-2.5 sm:px-6 rounded-full shadow-lg hover:bg-teal-600 transition-all duration-300 flex items-center font-medium transform hover:scale-[1.05] text-sm shrink-0"
                    >
                        <BookMarked className="h-4 w-4 mr-1 sm:mr-2" /> My Submissions
                    </Link>
                </div>
            </header>

            {/* Search Input Area */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search your classes by title or code..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-xl py-3 pl-12 pr-4 focus:border-[#03DAC6] focus:ring-1 focus:ring-[#03DAC6]/50 transition-all placeholder-[#bdbdbd]"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#03DAC6]" />
            </div>

            {/* Class Grid */}
            {myClasses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> 
                    {myClasses.map((classItem) => (
                        <ClassCard key={classItem._id} classData={classItem} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-surface rounded-xl border border-[#2f2f2f] shadow-lg">
                    <h2 className="text-2xl font-medium text-[#e0e0e0]">No Classes Found</h2>
                    <p className="text-[#bdbdbd] mt-2">Try adjusting your search or join a class using a code.</p>
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

            {/* Modal Component (already responsive from previous steps) */}
            <JoinClassModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose} 
            />
        </div>
    );
};

export default MyClasses;