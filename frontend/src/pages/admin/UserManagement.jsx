// src/pages/admin/UserManagement.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, updateUserRole } from "../../redux/slices/userSlice";
import {
  Search,
  Filter,
  User,
  ChevronDown,
  UserCog,
  CheckCheck,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";

const roles = ["all", "student", "teacher", "admin"];

const UserManagement = () => {
  const dispatch = useDispatch();
  // Safely destructur state properties
  const {
    userList = { items: [], pagination: {} },
    isLoading,
    error,
  } = useSelector((state) => state.users || {});

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users whenever filters/page change
  useEffect(() => {
    dispatch(
      fetchUsers({
        page: currentPage,
        limit: 10,
        q: debouncedSearchTerm,
        role: roleFilter === "all" ? "" : roleFilter,
      })
    );
  }, [dispatch, currentPage, debouncedSearchTerm, roleFilter]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleUpdate = (userId, newRole) => {
    // Prevent admin from changing their own role in a simple setup
    // FIX: Accessing the current user's ID from the global auth state is safer/more reliable.
    // Assuming auth state has the current logged-in user:
    // const currentUserId = useSelector(state => state.auth.user?._id);
    // if (userId === currentUserId) {
    //   alert("You cannot change your own role here.");
    //   return;
    // }

    if (
      window.confirm(`Are you sure you want to change user role to ${newRole}?`)
    ) {
      dispatch(updateUserRole({ userId, role: newRole }));
    }
  };

  if (isLoading && userList.items.length === 0) {
    return <Loader message="Loading admin user list..." />;
  }

  // --- UI Components ---

  const RoleBadge = ({ role }) => {
    let styleClasses = "bg-gray-600";
    let inlineStyle = {}; // Initialize empty inline style

    if (role === "admin") {
      styleClasses = "bg-red-700 text-red-100";
    } else if (role === "teacher") {
      styleClasses = "bg-[#ba68c8]/70 text-white"; // Keep this if it works for this color
    } else if (role === "student") {
      // #03DAC6 (Teal) is 3, 218, 198 in RGB. Opacity 0.7.
      styleClasses = "text-white";
      inlineStyle = { backgroundColor: "rgba(3, 218, 198, 0.7)" }; // 70% opacity Teal
    }

    // KEY CHANGE 1: Reduced text size on mobile
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${styleClasses}`}
        style={inlineStyle} // Apply the inline style
      >
        {role}
      </span>
    );
  };

  const UserTable = ({ users }) => (
    // The overflow-x-auto is the primary responsiveness feature for the table
    <div className="overflow-x-auto bg-surface rounded-xl shadow-[0_0_20px_rgba(186,104,200,0.1)] border border-[#2f2f2f]">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-[#2b2b2b]">
          <tr>
            {/* KEY CHANGE 2: Reduced padding and ensured no wrapping in headers */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Joined
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {users.map((user) => (
            // Apply hover stripe effect
            <tr key={user._id} className="hover:bg-[#2b2b2b] transition-colors">
              {/* KEY CHANGE 3: Reduced padding on table cells */}
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#e0e0e0]">
                {user.name}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[#bdbdbd]">
                {user.email}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[#bdbdbd]">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                {/* Role Change Dropdown */}
                <div className="inline-flex relative">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                    // KEY CHANGE 4: Reduced padding and width on select for mobile
                    className="appearance-none bg-gray-700 border border-gray-600 text-[#e0e0e0] rounded-md py-1.5 pl-3 pr-6 focus:ring-[#ba68c8] focus:border-[#ba68c8] cursor-pointer transition-all duration-200 w-28 text-xs sm:text-sm"
                    disabled={user.role === "admin"} // Better UX: Don't allow changing Admin role on self
                  >
                    {roles
                      .filter((r) => r !== "all")
                      .map((role) => (
                        <option key={role} value={role}>
                          {role.toUpperCase()}
                        </option>
                      ))}
                  </select>
                  {/* KEY CHANGE 5: Adjusted chevron position for smaller select box */}
                  <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-[#bdbdbd] pointer-events-none" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center border-b border-gray-700 pb-4">
        {/* KEY CHANGE 6: Reduced title size for mobile */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider flex items-center">
          <UserCog className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-[#ba68c8]" />
          User Management
        </h1>
        {error && (
          <p className="text-error text-sm font-medium">{error.message}</p>
        )}
      </header>

      {/* Controls: Search and Filter */}
      {/* KEY CHANGE 7: Changed to 'flex-col sm:flex-row' to stack on small mobile screens */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-grow group">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-12 pr-4 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all placeholder-[#bdbdbd]"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#ba68c8]" />
        </div>

        {/* Filter by Role */}
        <div className="relative flex-shrink-0">
          <select
            value={roleFilter}
            onChange={handleRoleChange}
            // KEY CHANGE 8: Added w-full for mobile, defaulting to 'w-48' only on medium screens
            className="w-full md:w-48 appearance-none bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-10 pr-8 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role === "all"
                  ? "All Roles"
                  : role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#ba68c8] pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#bdbdbd] pointer-events-none" />
        </div>
      </div>

      {/* User Data Table */}
      {userList.items.length > 0 ? (
        <UserTable users={userList.items} />
      ) : (
        <div className="text-center py-12 bg-surface rounded-xl border border-[#2f2f2f] shadow-lg">
          <h2 className="text-2xl font-medium text-[#e0e0e0]">
            No Users Match Criteria
          </h2>
          <p className="text-[#bdbdbd] mt-2">
            Try clearing your search or filter.
          </p>
        </div>
      )}

      {/* Pagination */}
      {userList.pagination.pages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={userList.pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default UserManagement;
