import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/services/api";
import { themeReducer } from "@/features/theme/themeSlice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
