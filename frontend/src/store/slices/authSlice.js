import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// ASYNC THUNKS
export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
    try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
});

export const signup = createAsyncThunk('auth/signup', async (userData, { rejectWithValue }) => {
    try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/register`, userData);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.error || 'Signup failed');
    }
});

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async ({ email, otp }, { rejectWithValue }) => {
    try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { email, otp });
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.error || 'OTP verification failed');
    }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async (googleData, { rejectWithValue }) => {
    try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/google`, googleData);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.error || 'Google Login failed');
    }
});

const getInitialUser = () => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
};

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: getInitialUser(),
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            localStorage.removeItem('user');
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
            .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Signup
            .addCase(signup.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(signup.fulfilled, (state) => { state.loading = false; })
            .addCase(signup.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Verify OTP
            .addCase(verifyOTP.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(verifyOTP.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
            .addCase(verifyOTP.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Google Login
            .addCase(googleLogin.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(googleLogin.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
            .addCase(googleLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
