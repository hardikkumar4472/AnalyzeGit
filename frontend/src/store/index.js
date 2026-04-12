import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import analysisReducer from './slices/analysisSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        theme: themeReducer,
        analysis: analysisReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Useful for complex API responses
        }),
});

export default store;
export * from './slices/authSlice';
export * from './slices/themeSlice';
export * from './slices/analysisSlice';
