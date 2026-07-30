import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/services/api";
import { themeReducer } from "@/features/theme/themeSlice";

export function renderWithProviders(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}
