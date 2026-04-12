import { createSlice } from '@reduxjs/toolkit';

const analysisSlice = createSlice({
    name: 'analysis',
    initialState: {
        result: null,
        loading: false,
        error: null,
        progress: { stage: '', percent: 0 },
        jobId: null
    },
    reducers: {
        setAnalysisLoading: (state, action) => {
            state.loading = action.payload;
            if (action.payload) {
                state.error = null;
                state.result = null;
                state.progress = { stage: 'Initializing...', percent: 0 };
            }
        },
        setAnalysisProgress: (state, action) => {
            state.progress = action.payload;
        },
        setAnalysisResult: (state, action) => {
            state.result = action.payload;
            state.loading = false;
            state.progress = { stage: '', percent: 0 };
        },
        setAnalysisError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
            state.progress = { stage: '', percent: 0 };
        },
        clearAnalysis: (state) => {
            state.result = null;
            state.loading = false;
            state.error = null;
            state.progress = { stage: '', percent: 0 };
            state.jobId = null;
        }
    }
});

export const { 
    setAnalysisLoading, 
    setAnalysisProgress, 
    setAnalysisResult, 
    setAnalysisError, 
    clearAnalysis 
} = analysisSlice.actions;
export default analysisSlice.reducer;
