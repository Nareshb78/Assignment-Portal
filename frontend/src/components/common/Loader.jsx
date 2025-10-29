// src/components/common/Loader.jsx

import React from "react";
import { Loader as LoaderIcon } from "lucide-react";

/**
 * Renders a spinning loading indicator.
 * @param {object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Controls the size of the spinner.
 * @param {string} [props.message] - Optional message to display below the spinner.
 */
const Loader = ({ size = "md", message }) => {
  let sizeClasses;

  switch (size) {
    case "sm":
      // h-5 w-5 is 1.25rem
      sizeClasses = "h-5 w-5"; 
      break;
    case "lg":
      // h-12 w-12 is 3rem
      sizeClasses = "h-12 w-12"; 
      break;
    case "md":
    default:
      // h-8 w-8 is 2rem
      sizeClasses = "h-8 w-8"; 
      break;
  }

  return (
    // KEY CHANGE 1: Use minimal 'p-2' on the wrapper (if used outside of a centered page layout) 
    // to give it flexibility. The 'flex flex-col items-center justify-center' ensures centering 
    // regardless of parent size.
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 w-full">
      {/* The Lucide-React icon needs the animation, which we define via Tailwind CSS 
        configuration or a direct animation class. We rely on the 'sizeClasses' for dimensions. 
      */}
      <LoaderIcon
        // Added text-[#ba68c8] for explicit color (assuming accentPrimary is that color)
        className={`${sizeClasses} text-[#ba68c8] animate-spin`}
        aria-hidden="true"
      />
      {message && (
        // KEY CHANGE 2: Ensures the text size remains small and centered.
        <p className="mt-3 text-[#bdbdbd] text-xs sm:text-sm font-medium text-center max-w-full">
            {message}
        </p>
      )}
    </div>
  );
};

export default Loader;