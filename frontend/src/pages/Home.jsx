// src/pages/Home.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, GraduationCap, Zap } from 'lucide-react';

const Home = () => {
  return (
	<div className="text-center py-12 sm:py-20 px-4 space-y-8 sm:space-y-10 bg-surface rounded-2xl shadow-xl border border-gray-800">
	  <Zap className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-[#03DAC6] animate-pulse" />
	  <h1 className="text-3xl sm:text-5xl font-extrabold text-[#e0e0e0]">
		Welcome to the Classroom Assignment Portal
	  </h1>
	  <p className="text-base sm:text-xl text-[#bdbdbd] max-w-3xl mx-auto">
		Your secure platform for managing classes, submitting assignments, and tracking grades. 
		Please log in to access your role-specific dashboard.
	  </p>

	  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
		<Link
		  to="/login"
		  className="w-full sm:w-auto bg-[#ba68c8] text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-violet-700 transition-colors flex items-center justify-center"
		>
		  <LogIn className="h-5 w-5 mr-2" /> Log In
		</Link>
		<Link
		  to="/register"
		  className="w-full sm:w-auto border border-[#03DAC6] text-[#03DAC6] font-bold py-3 px-8 rounded-lg hover:bg-[#03DAC6]/10 transition-colors flex items-center justify-center"
		>
		  <GraduationCap className="h-5 w-5 mr-2" /> Register as Student
		</Link>
	  </div>
	</div>
  );
};

export default Home;