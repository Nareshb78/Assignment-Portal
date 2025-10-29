import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

setAuthToken(localStorage.getItem('token'));


// --- INITIAL STATE ---
const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,
};


// POST /api/auth/login (FIXED ERROR HANDLING)
export const loginUser = createAsyncThunk(
    'auth/login',
    async (userData, thunkAPI) => {
        try {
            const response = await axios.post('/api/auth/login', userData);
            const { token, ...user } = response.data;
            
            // Store token and user data locally
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            return { token, user };
        } catch (error) {
            // CRITICAL FIX: Extract the specific message and reject the promise
            const message = error.response?.data?.message || 'Network error.';
            return thunkAPI.rejectWithValue({ message }); 
        }
    }
);

// POST /api/auth/register (Updated for consistent error handling)
export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, thunkAPI) => {
        try {
            const response = await axios.post('/api/auth/register', userData);
            const { token, ...user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            return { token, user };
        } catch (error) {
            const message = error.response?.data?.message || 'Network error.';
            return thunkAPI.rejectWithValue({ message }); 
        }
    }
);

// PATCH /api/me (Updated for consistent error handling)
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (profileData, thunkAPI) => {
        try {
            const response = await axios.patch('/api/me', profileData); 
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Network error.';
            return thunkAPI.rejectWithValue({ message }); 
        }
    }
);


const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setAuthToken(null); // Clear Axios header on logout
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // --- Login ---
            .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                setAuthToken(action.payload.token); // Set Axios header
            })
            .addCase(loginUser.rejected, (state, action) => { 
                state.isLoading = false; 
                state.error = action.payload; 
                state.user = null; 
            })
            
            // --- Register ---
            .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                setAuthToken(action.payload.token); // Set Axios header
            })
            .addCase(registerUser.rejected, (state, action) => { 
                state.isLoading = false; 
                state.error = action.payload; 
                state.user = null; 
            })

            // --- Update Profile ---
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.user = { ...state.user, ...action.payload }; // Merge updates
                localStorage.setItem('user', JSON.stringify(state.user));
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;