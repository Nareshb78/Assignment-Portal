// src/components/admin/EnrollStudentByEmailModal.jsx

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { enrollInClass } from '../../redux/slices/classSlice';
import { X, Mail, CheckCircle, UserPlus, Layers } from 'lucide-react';
import Loader from '../common/Loader';

const EnrollStudentByEmailModal = ({ isOpen, onClose, classes }) => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector(state => state.classes);

    const [formData, setFormData] = useState({
        classId: '',
        studentEmail: '',
    });
    const [statusMessage, setStatusMessage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setStatusMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage(null);

        if (!formData.classId || !formData.studentEmail) {
            setStatusMessage({ type: 'error', message: 'Please select a class and provide an email.' });
            return;
        }

        try {
            // Admin/Teacher enrollment uses the student's email property.
            await dispatch(enrollInClass({ 
                classId: formData.classId, 
                enrollmentData: { email: formData.studentEmail } 
            })).unwrap();

            setStatusMessage({ type: 'success', message: 'Enrollment successful!' });
            setFormData({ ...formData, studentEmail: '' }); 

        } catch (err) {
            setStatusMessage({ type: 'error', message: err.message || 'Enrollment failed. User may not exist.' });
        }
    };

    if (!isOpen || !classes) return null;

    return (
        // KEY CHANGE 1: Added 'p-4' to the fixed container to ensure screen padding on small devices.
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            {/* KEY CHANGE 2: Updated padding from 'p-8' to 'p-6 sm:p-8' for better mobile fit.
              KEY CHANGE 3: Added 'max-h-full overflow-y-auto' to make the modal scrollable if content exceeds the viewport height on small screens.
            */}
            <div className="bg-surface p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-[#2f2f2f] transform transition-all duration-300 max-h-full overflow-y-auto">
                
                <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-6">
                    {/* KEY CHANGE 4: Reduced heading size on small screens with 'text-xl sm:text-2xl' */}
                    <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8]">Enroll Student by Email</h2>
                    <button onClick={onClose} className="text-[#bdbdbd] hover:text-red-400">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Class Selection Dropdown */}
                    <div className="relative">
                        <Layers className="absolute left-3 top-3 h-5 w-5 text-[#bdbdbd] pointer-events-none" />
                        <select 
                            name="classId" 
                            value={formData.classId} 
                            onChange={handleChange} 
                            required
                            className="w-full appearance-none bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] cursor-pointer"
                        >
                            <option value="" disabled>-- Select Target Class --</option>
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.title} ({c.code})</option>
                            ))}
                        </select>
                    </div>

                    {/* Student Email Input */}
                    <div className="relative group">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#ba68c8]" />
                        <input
                            type="email"
                            name="studentEmail"
                            placeholder="Student Email Address"
                            value={formData.studentEmail}
                            onChange={handleChange}
                            required
                            className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all"
                        />
                    </div>
                    
                    {/* Status Message */}
                    {statusMessage && (
                        <div className={`p-3 rounded-lg border text-sm font-medium ${
                            statusMessage.type === 'success' ? 'bg-green-700/30 text-green-400 border-green-700' : 
                            'bg-red-900/40 text-red-400 border-red-700'
                        }`}>
                            {statusMessage.message}
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#ba68c8] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-violet-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.01]"
                    >
                        {isLoading ? (
                            <Loader size="sm" />
                        ) : (
                            <>
                                <UserPlus className="h-5 w-5 mr-2" /> Enroll Student
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EnrollStudentByEmailModal;