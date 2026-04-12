import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const themeSlice = createSlice({
    name: 'theme',
    initialState: {
        isDarkMode: getInitialTheme(),
    },
    reducers: {
        toggleTheme: (state) => {
            state.isDarkMode = !state.isDarkMode;
            const root = window.document.documentElement;
            if (state.isDarkMode) {
                root.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                root.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        },
        setTheme: (state, action) => {
            state.isDarkMode = action.payload;
            const root = window.document.documentElement;
            if (state.isDarkMode) {
                root.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                root.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
