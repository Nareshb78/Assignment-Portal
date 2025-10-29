// src/redux/slices/assignmentSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  assignmentsByClass: {}, 
  selectedAssignment: null,
  isLoading: false,
  error: null,
};

// Async Thunks (Mapping to Backend API)

// GET /api/classes/:classId/assignments?page=&q=&statusFilter=...
export const fetchAssignments = createAsyncThunk(
  'assignments/fetchAssignments',
  async ({ classId, page = 1, limit = 10, q = '', statusFilter = '' }, thunkAPI) => {
    const response = await axios.get(
        `/api/classes/${classId}/assignments?page=${page}&limit=${limit}&q=${q}&statusFilter=${statusFilter}`
    );
    // Response format: { items: [], pagination: {} }
    return { classId, data: response.data };
  }
);

// POST /api/classes/:classId/assignments
export const createAssignment = createAsyncThunk(
    'assignments/createAssignment',
    async ({ classId, assignmentData }, thunkAPI) => {
        const response = await axios.post(`/api/classes/${classId}/assignments`, assignmentData);
        return response.data.assignment;
    }
);

// GET /api/classes/:classId/assignments/:assignmentId
export const fetchAssignmentDetail = createAsyncThunk(
    'assignments/fetchAssignmentDetail',
    async ({ classId, assignmentId }, thunkAPI) => {
        const response = await axios.get(`/api/classes/${classId}/assignments/${assignmentId}`);
        return response.data.assignment;
    }
);


// Assignment Slice
const assignmentSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- fetchAssignments ---
      .addCase(fetchAssignments.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.isLoading = false;
        const { classId, data } = action.payload;
        // Store assignments keyed by classId (required for student/teacher dashboards)
        state.assignmentsByClass[classId] = {
            items: data.items,
            pagination: data.pagination
        };
      })
      .addCase(fetchAssignments.rejected, (state, action) => { state.isLoading = false; state.error = action.error.message; })

      // --- createAssignment ---
      .addCase(createAssignment.fulfilled, (state, action) => {
        // Optionally update the list if it's currently fetched, or rely on a re-fetch
        state.selectedAssignment = action.payload;
      })

      // --- fetchAssignmentDetail ---
      .addCase(fetchAssignmentDetail.fulfilled, (state, action) => {
        state.selectedAssignment = action.payload;
      });
  },
});

export default assignmentSlice.reducer;