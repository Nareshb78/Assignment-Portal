// src/redux/slices/userSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  userList: { items: [], pagination: {} }, // Admin's user list
  isLoading: false,
  error: null,
};

// Async Thunks (Mapping to Backend API)

/** GET /api/users?role=&q=&page= (Admin user listing) */
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page = 1, limit = 10, q = '', role = '' }, thunkAPI) => {
    // This endpoint is guarded by restrictTo('admin') on the backend
    const response = await axios.get(
      `/api/users?page=${page}&limit=${limit}&q=${q}&role=${role}`
    );
    // Response format: { items: [], pagination: {} }
    return response.data;
  }
);

/** PATCH /api/users/:userId/role (Admin role update) */
export const updateUserRole = createAsyncThunk(
    'users/updateUserRole',
    async ({ userId, role }, thunkAPI) => {
        const response = await axios.patch(`/api/users/${userId}/role`, { role });
        return response.data.user;
    }
);


// User Slice
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- fetchUsers ---
      .addCase(fetchUsers.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userList.items = action.payload.items;
        state.userList.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => { state.isLoading = false; state.error = action.error.message; })

      // --- updateUserRole ---
      .addCase(updateUserRole.fulfilled, (state, action) => {
        // Update the specific user's role in the list
        const updatedUser = action.payload;
        const index = state.userList.items.findIndex(u => u._id === updatedUser._id);
        if (index !== -1) {
             state.userList.items[index].role = updatedUser.role;
        }
      });
  },
});

export default userSlice.reducer;