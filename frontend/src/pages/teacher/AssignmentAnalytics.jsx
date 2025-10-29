// src/pages/teacher/AssignmentAnalytics.jsx

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchGradeDistribution } from "../../redux/slices/submissionSlice";
import { BarChart2, Hash, Percent, X } from "lucide-react";
import Loader from "../../components/common/Loader";

const AssignmentAnalytics = () => {
  const { classId, assignmentId } = useParams();
  const dispatch = useDispatch();

  // Fetch state from the submissions slice
  const { gradeDistribution: distribution, isLoading } = useSelector(
    (state) => state.submissions
  );
  const [chartData, setChartData] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(true);

  // Fetch the aggregated data
  useEffect(() => {
    setAnalysisLoading(true);
    dispatch(fetchGradeDistribution({ classId, assignmentId }))
      .then((action) => {
        // Assuming successful fetch returns the data array directly
        const data = action.payload;
        setChartData(data);
      })
      .finally(() => {
        setAnalysisLoading(false);
      });
  }, [dispatch, classId, assignmentId]);

  // Derived analysis
  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);
  const assignmentName = "Final Project: MERN Stack"; // Mock Name

  // Function to calculate bar height and color for visualization
  const getBarProperties = (count) => {
    if (totalCount === 0) return { height: "0%", color: "#bdbdbd" };

    const heightPercent = (count / totalCount) * 100;
    let color;

    // Custom colors based on grade bands (A, B, C, D, F/Other)
    const range = chartData.find((d) => d.count === count)?.range || "";
    if (range.includes("90")) color = "#03DAC6"; // A (Teal)
    else if (range.includes("80")) color = "#00BCD4"; // B (Cyan)
    else if (range.includes("70")) color = "#FFC107"; // C (Yellow)
    else if (range.includes("60")) color = "#FF9800"; // D (Orange)
    else color = "#F44336"; // F/Other (Red)

    return { height: `${Math.max(5, heightPercent)}%`, color }; // Minimum height for visibility
  };

  if (analysisLoading) {
    return <Loader message="Analyzing grade distribution..." />;
  }

  return (
    // KEY CHANGE 1: Removed max-width
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700">
        {/* KEY CHANGE 2: Reduced header text size for mobile and ensured content wrapping */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider flex flex-col sm:flex-row items-start sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            <BarChart2 className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-[#ba68c8] flex-shrink-0" />
            Grade Distribution:
          </div>
          <span className="text-[#ba68c8] ml-0 sm:ml-2 text-2xl sm:text-4xl font-extrabold break-words">
            {assignmentName}
          </span>
        </h1>
        {/* KEY CHANGE 3: Reduced paragraph text size for mobile */}
        <p className="text-[#bdbdbd] mt-1 text-sm sm:text-lg">
          Analysis based on {totalCount} graded submissions.
        </p>
      </header>

      {totalCount === 0 ? (
        <div className="text-center py-20 bg-surface rounded-xl border border-[#2f2f2f]">
          <h2 className="text-2xl font-medium text-[#bdbdbd]">
            No Graded Submissions Yet
          </h2>
          <p className="text-sm text-[#bdbdbd] mt-2">
            The chart will appear after the first few submissions are scored.
          </p>
        </div>
      ) : (
        <div className="bg-surface p-4 sm:p-8 rounded-xl border border-[#2f2f2f] shadow-lg">
          <h3 className="text-xl font-semibold text-[#e0e0e0] mb-6 border-b border-gray-800 pb-2">
            Score Buckets (Count of Students)
          </h3>

          {/* Bar Chart Visualization Area - KEY CHANGE 4: Added overflow-x-auto for horizontal scrolling */}
          <div className="overflow-x-auto w-full">
            {/* KEY CHANGE 5: Ensured min-width for the chart area to guarantee bar spacing */}
            <div
              className="flex justify-between items-end h-64 border-b-2 border-l-2 border-gray-700 pb-2 pl-2"
              style={{ minWidth: "600px" }}
            >
              {chartData.map((item, index) => {
                const { height, color } = getBarProperties(item.count);
                return (
                  // KEY CHANGE 6: Reduced horizontal margin on the bar container
                  <div
                    key={index}
                    className="flex flex-col items-center h-full mx-0.5 sm:mx-1 group cursor-pointer relative"
                    style={{ width: `${100 / chartData.length}%` }}
                  >
                    {/* Bar */}
                    <div
                      className="w-6 sm:w-8 rounded-t-sm transition-all duration-500 hover:opacity-80 flex-shrink-0"
                      style={{ height: height, backgroundColor: color }}
                    ></div>

                    {/* Tooltip/Value */}
                    {/* KEY CHANGE 7: Adjusted tooltip positioning to avoid cutting off */}
                    <div className="absolute top-0 text-xs font-bold mt-2 text-[#e0e0e0] opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-900/90 rounded z-10">
                      {item.count}
                    </div>

                    {/* Label */}
                    {/* KEY CHANGE 8: Ensured label text is smaller and can be truncated */}
                    <span className="text-xs text-[#bdbdbd] mt-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-full block">
                      {item.range.split(" (")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Data Table Summary */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-[#ba68c8] mb-3 flex items-center">
              <Hash className="h-5 w-5 mr-2" /> Distribution Summary
            </h3>
            {/* KEY CHANGE 9: Changed to a responsive grid that stacks on small screens (2 columns) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-sm text-[#bdbdbd] font-medium">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-800 border border-gray-700"
                >
                  <p className="text-[#ba68c8] text-base font-semibold">
                    {item.range}
                  </p>
                  <p className="text-[#e0e0e0] font-bold mt-1 text-sm">
                    {item.count} Submissions
                  </p>
                  <p className="text-xs flex items-center text-[#03DAC6] mt-1">
                    <Percent size={12} className="mr-1" />
                    {((item.count / totalCount) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentAnalytics;
