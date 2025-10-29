import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
    myClasses: [],
    selectedClass: null,
    pagination: {},
    isLoading: false,
    error: null,
};
// GET /api/classes?mine=1&page=...
export const fetchMyClasses = createAsyncThunk(
    'classes/fetchMyClasses',
    async ({ page = 1, limit = 10, q = '', mine = true }, thunkAPI) => {
        const mineParam = mine === true || mine === '1' ? 'mine=1&' : 'mine=0&';
        const response = await axios.get(`/api/classes?${mineParam}page=${page}&limit=${limit}&q=${q}`);
        return response.data;
    }
);

// POST /api/classes
export const createClass = createAsyncThunk(
    'classes/createClass',
    async (classData, thunkAPI) => {
        try {
            const response = await axios.post('/api/classes', classData);
            return response.data.class;
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to create class. Check network.';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// GET /api/classes/:id
export const fetchClassById = createAsyncThunk(
    'classes/fetchClassById',
    async (classId, thunkAPI) => {
        const response = await axios.get(`/api/classes/${classId}`);
        return response.data.class;
    }
);

// POST /api/classes/:id/enroll
export const enrollInClass = createAsyncThunk(
    'classes/enrollInClass',
    async ({ classId, enrollmentData }, thunkAPI) => {
        const response = await axios.post(`/api/classes/${classId}/enroll`, enrollmentData);
        return response.data.class;
    }
);

// PATCH /api/classes/:classId (For updating details or reassigning teacher)
export const updateClass = createAsyncThunk(
    'classes/updateClass',
    async ({ classId, updateFields }, thunkAPI) => {
        const response = await axios.patch(`/api/classes/${classId}`, updateFields);
        return response.data.class;
    }
);

// DELETE /api/classes/:classId
export const deleteClass = createAsyncThunk(
    'classes/deleteClass',
    async (classId, thunkAPI) => {
        await axios.delete(`/api/classes/${classId}`);
        return classId; 
    }
);

// DELETE /api/classes/:classId/members/:userId
export const removeMember = createAsyncThunk(
    'classes/removeMember',
    async ({ classId, userIdToRemove }, thunkAPI) => {
        try {
            await axios.delete(`/api/classes/${classId}/members/${userIdToRemove}`);
            return { classId, userIdToRemove }; // Return data necessary for reducer update
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to remove member.';
            return thunkAPI.rejectWithValue(message);
        }
    }
);


const classSlice = createSlice({
    name: 'classes',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // --- fetchMyClasses (Source of Truth) ---
            .addCase(fetchMyClasses.pending, (state) => { state.isLoading = true; state.error = null; })
            .addCase(fetchMyClasses.fulfilled, (state, action) => {
                state.isLoading = false;
                
                state.myClasses = action.payload.items;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchMyClasses.rejected, (state, action) => { state.isLoading = false; state.error = action.error.message; })

            // --- createClass ---
            .addCase(createClass.fulfilled, (state, action) => {
                // Rely on fetchMyClasses refetch
            })
            
            // --- fetchClassById ---
            .addCase(fetchClassById.pending, (state) => { state.isLoading = true; state.selectedClass = null; })
            .addCase(fetchClassById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedClass = action.payload;
            })
            .addCase(fetchClassById.rejected, (state, action) => { state.isLoading = false; state.error = action.error.message; })

            // --- enrollInClass ---
            .addCase(enrollInClass.fulfilled, (state, action) => {
                // Update detail if currently viewed
                if (state.selectedClass?._id === action.payload._id) {
                    state.selectedClass = action.payload;
                }
            })
            
            // --- updateClass ---
            .addCase(updateClass.fulfilled, (state, action) => {
                const updatedClass = action.payload;
                // Update the list item
                const index = state.myClasses.findIndex(c => c._id === updatedClass._id);
                if (index !== -1) {
                    state.myClasses[index] = updatedClass;
                }
                // Update the detail view item
                if (state.selectedClass?._id === updatedClass._id) {
                    state.selectedClass = updatedClass;
                }
            })
            
            .addCase(removeMember.fulfilled, (state, action) => {
                const { classId, userIdToRemove } = action.payload;
                
                // Helper function to safely get the ID string from a member object
                const getMemberIdString = (member) => {
                    // Check if member.userId is a populated object or a simple ID string
                    return member.userId?._id?.toString() || member.userId?.toString(); 
                };

                // 1. Update selectedClass if it matches
                if (state.selectedClass?._id === classId) {
                    // Filter the member out of the selectedClass member array
                    state.selectedClass.members = state.selectedClass.members.filter(
                        member => getMemberIdString(member) !== userIdToRemove
                    );
                }
                
                // 2. Update myClasses list item (updates member count on dashboard list)
                const classIndex = state.myClasses.findIndex(c => c._id === classId);
                if (classIndex !== -1) {
                    state.myClasses[classIndex].members = state.myClasses[classIndex].members.filter(
                        member => getMemberIdString(member) !== userIdToRemove
                    );
                }
            })

            // --- deleteClass ---
            .addCase(deleteClass.fulfilled, (state, action) => {
                const deletedClassId = action.payload;
                // Filter the deleted class out of the list
                state.myClasses = state.myClasses.filter(c => c._id !== deletedClassId);
                // Clear selected class if it was the one deleted
                if (state.selectedClass?._id === deletedClassId) {
                    state.selectedClass = null;
                }
            });
    },
});

export default classSlice.reducer;