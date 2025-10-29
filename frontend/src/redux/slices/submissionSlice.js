import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  mySubmissions: { items: [], pagination: {} }, // Student's list
  submissionQueue: { items: [], pagination: {} }, // Teacher's list
  selectedSubmission: null,
  comments: [], // To store threaded comments for the selected submission
  gradeDistribution: null, // Analytics data
  isLoading: false,
  error: null,
};


/** GET /api/submissions/:submissionId (Fetches detail) */
export const getSubmissionById = createAsyncThunk(
  "submissions/getSubmissionById",
  async (submissionId, thunkAPI) => {
    const response = await axios.get(`/api/submissions/${submissionId}`);
    // Return the submission object directly for the reducer
    return response.data.submission;
  }
);

/** POST /api/classes/:cId/assignments/:aId/submissions (Student submits or resubmits) */
export const submitAssignmentWork = createAsyncThunk(
  "submissions/submitWork",
  async ({ classId, assignmentId, linkOrFiles }, thunkAPI) => {
    try {
      const response = await axios.post(
        `/api/classes/${classId}/assignments/${assignmentId}/submissions`,
        { linkOrFiles }
      );
      return response.data.submission;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Submission failed. Check network.";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/** GET /api/submissions/me?page=... (Student's aggregated view) */
export const fetchMySubmissions = createAsyncThunk(
  "submissions/fetchMySubmissions",
  // CRITICAL FIX: Ensure 'status' parameter is used in the URL
  async ({ page = 1, limit = 10, status = "" }, thunkAPI) => {
    const response = await axios.get(
      `/api/submissions/me?page=${page}&limit=${limit}&status=${status}`
    );
    return response.data; // Returns { items, pagination }
  }
);

/** GET /api/classes/:cId/assignments/:aId/submissions?status=... (Teacher's queue) */
export const fetchSubmissionQueue = createAsyncThunk(
  "submissions/fetchSubmissionQueue",
  async (
    { classId, assignmentId, page = 1, limit = 10, status = "" },
    thunkAPI
  ) => {
    const response = await axios.get(
      `/api/classes/${classId}/assignments/${assignmentId}/submissions?page=${page}&limit=${limit}&status=${status}`
    );
    return response.data;
  }
);

/** PATCH /api/submissions/:submissionId/grade (Teacher grading) */
export const gradeSubmission = createAsyncThunk(
  "submissions/gradeSubmission",
  async ({ submissionId, score, feedback, lateOverride }, thunkAPI) => {
    const response = await axios.patch(
      `/api/submissions/${submissionId}/grade`,
      { score, feedback, lateOverride }
    );
    return response.data.submission;
  }
);

/** GET /api/classes/:cId/assignments/:aId/grades/distribution (Analytics) */
export const fetchGradeDistribution = createAsyncThunk(
  "submissions/fetchGradeDistribution",
  async ({ classId, assignmentId }, thunkAPI) => {
    const response = await axios.get(
      `/api/classes/${classId}/assignments/${assignmentId}/grades/distribution`
    );
    return response.data.distribution;
  }
);

/** GET /api/submissions/:sId/comments (Fetch all comments for a submission) */
export const fetchCommentsForSubmission = createAsyncThunk(
  "submissions/fetchCommentsForSubmission",
  async (submissionId, thunkAPI) => {
    const response = await axios.get(
      `/api/submissions/${submissionId}/comments`
    );
    return response.data.comments;
  }
);

/** POST /api/submissions/:sId/comments (Post a new comment) */
export const postComment = createAsyncThunk(
  "submissions/postComment",
  async ({ submissionId, text, parentId = null }, thunkAPI) => {
    const response = await axios.post(
      `/api/submissions/${submissionId}/comments`,
      { text, parentId }
    );
    return response.data.comment;
  }
);

// =================================================================
// ✂️ CLASS SLICE
// =================================================================

const submissionSlice = createSlice({
  name: "submissions",
  initialState,
  reducers: {
    clearSelectedSubmission: (state) => {
      state.selectedSubmission = null;
      state.comments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // --- getSubmissionById (DETAIL FETCH) ---
      .addCase(getSubmissionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSubmissionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedSubmission = action.payload; // Payload is the submission object
      })
      .addCase(getSubmissionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        state.selectedSubmission = null;
      })

      // --- submitAssignmentWork ---
      .addCase(submitAssignmentWork.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitAssignmentWork.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedSubmission = action.payload;
      })
      .addCase(submitAssignmentWork.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // --- fetchMySubmissions (Student List) ---
      .addCase(fetchMySubmissions.fulfilled, (state, action) => {
        state.mySubmissions.items = action.payload.items;
        state.mySubmissions.pagination = action.payload.pagination;
      })

      // --- fetchSubmissionQueue (Teacher List) ---
      .addCase(fetchSubmissionQueue.fulfilled, (state, action) => {
        state.submissionQueue.items = action.payload.items;
        state.submissionQueue.pagination = action.payload.pagination;
      })

      // --- gradeSubmission ---
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        const gradedSubmission = action.payload;
        // Update selected detail view
        if (state.selectedSubmission?._id === gradedSubmission._id) {
          state.selectedSubmission = gradedSubmission;
        }
        // Update item in queue list
        const index = state.submissionQueue.items.findIndex(
          (s) => s._id === gradedSubmission._id
        );
        if (index !== -1) {
          state.submissionQueue.items[index] = gradedSubmission;
        }
      })

      // --- fetchGradeDistribution ---
      .addCase(fetchGradeDistribution.fulfilled, (state, action) => {
        state.gradeDistribution = action.payload;
      })

      // --- fetchCommentsForSubmission ---
      .addCase(fetchCommentsForSubmission.fulfilled, (state, action) => {
        state.comments = action.payload;
      })

      // --- postComment ---
      .addCase(postComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      });
  },
});

export const { clearSelectedSubmission } = submissionSlice.actions;
export default submissionSlice.reducer;
