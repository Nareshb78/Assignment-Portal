// /server.js

const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/database');

// --- Required Imports ---
const { protect } = require('./middleware/auth.middleware'); // Used for all protected routes
const { updateMyProfile } = require('./controllers/user.controller'); // Controller for PATCH /api/me
// ------------------------

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const classRoutes = require('./routes/class.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const submissionRoutes = require('./routes/submission.routes');

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();

// Connect to MongoDB
connectDB();

// === Security and Middleware ===
app.use(helmet()); 
app.use(cors({
    origin: process.env.CLIENT_URL, 
    credentials: true 
}));
app.use(express.json()); // Body parser for JSON data

// === API Routes ===
// The base paths are derived from the API design:
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);

// --- FIX: Explicitly register the PATCH /api/me route ---
// This handles profile updates called by the frontend.
app.patch('/api/me', protect, updateMyProfile);
// -----------------------------------------------------

// === Global Error Handler (Optional but recommended) ===
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || "An unexpected error occurred",
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0',() => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));