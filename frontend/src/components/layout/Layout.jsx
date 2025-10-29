// src/components/layout/Layout.jsx

import React from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    // Ensure the entire app container takes up at least the full viewport height
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <Navbar />
      {/* The <main> tag correctly handles responsiveness by:
        1. max-w-7xl: Limiting width on very large screens.
        2. w-full: Ensuring it takes up full width on smaller screens.
        3. mx-auto: Centering the content horizontally.
        4. p-4 sm:p-6 lg:p-8: Scaling padding with screen size.
      */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
       
        <div className="mt-4 md:mt-6">
            <Outlet />
        </div>
      </main>
      {/* Footer can be added here if necessary */}
    </div>
  );
};

export default Layout;