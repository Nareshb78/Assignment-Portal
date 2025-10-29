// src/redux/store.js

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import classReducer from './slices/classSlice';
import assignmentReducer from './slices/assignmentSlice';
import submissionReducer from './slices/submissionSlice';
import userReducer from './slices/userSlice'; // For Admin tasks

export const store = configureStore({
  reducer: {
    auth: authReducer,
    classes: classReducer,
    assignments: assignmentReducer,
    submissions: submissionReducer,
    users: userReducer,
  },
  // Adding middleware can handle potential serialization checks
  // but we omit complex setup for simplicity here.
});