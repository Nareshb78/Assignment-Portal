// src/components/common/Pagination.jsx

import React, { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { theme } from "../../assets/theme";

/**
 * Renders a set of pagination buttons.
 * @param {object} props
 * @param {number} props.currentPage - The currently active page number.
 * @param {number} props.totalPages - The total number of pages available.
 * @param {function} props.onPageChange - Callback function when a page button is clicked.
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Keeping the logic constant per request.
  const MAX_VISIBLE_PAGES = 5; 

  const handlePageClick = useCallback(
    (page) => {
      if (page > 0 && page <= totalPages) {
        onPageChange(page);
      }
    },
    [totalPages, onPageChange]
  );

  const renderPageNumbers = () => {
    const pages = [];

    // Logic to calculate which page numbers to display, keeping the current page centered
    let startPage = Math.max(
      1,
      currentPage - Math.floor(MAX_VISIBLE_PAGES / 2)
    );
    let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

    if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
      startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
    }

    // Add "1" and ellipsis if necessary
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    // Add core visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis and "Last Page" if necessary
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (page === "...") {
        return (
          // KEY CHANGE 1: Reduced padding on ellipsis for compact mobile view
          <span key={index} className="px-2 py-1 text-[#bdbdbd] select-none text-sm">
            ...
          </span>
        );
      }

      const isActive = page === currentPage;
      // KEY CHANGE 2: Reduced horizontal margin (mx-1) to 'mx-0.5' for mobile, then restore on small screens 'sm:mx-1'
      const baseClasses =
        "mx-0.5 sm:mx-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors";
      const activeClasses = `bg-[#ba68c8] text-white shadow-md`;
      const inactiveClasses = `bg-gray-800 text-[#e0e0e0] hover:bg-gray-700 cursor-pointer`;

      return (
        <button
          key={index}
          onClick={() => handlePageClick(page)}
          className={`${baseClasses} ${
            isActive ? activeClasses : inactiveClasses
          }`}
          aria-current={isActive ? "page" : undefined}
          disabled={isActive}
        >
          {page}
        </button>
      );
    });
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    // KEY CHANGE 3: The main container now allows horizontal scrolling on small screens.
    // 'overflow-x-auto' allows scrolling if the page buttons overflow the container width.
    // 'whitespace-nowrap' prevents button wrapping, forcing the scroll.
    <div className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap py-2">
      {/* Previous Button - Padding is fine */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="shrink-0 p-2 rounded-lg bg-gray-800 text-[#e0e0e0] hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Page Numbers Container */}
      {/* Note: The buttons themselves are now wrapped inside this container and rely on 'overflow-x-auto' */}
      <div className="flex items-center">
        {renderPageNumbers()}
      </div>


      {/* Next Button - Padding is fine */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="shrink-0 p-2 rounded-lg bg-gray-800 text-[#e0e0e0] hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Pagination;