import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Theme = "light" | "dark";

const STORAGE_KEY = "snaplink:theme";

function getSystemPreference(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return getSystemPreference();
}

interface ThemeState {
  value: Theme;
}

const initialState: ThemeState = {
  value: getInitialTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.value = state.value === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, state.value);
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.value = action.payload;
      window.localStorage.setItem(STORAGE_KEY, state.value);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;
