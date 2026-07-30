import { api } from "@/services/api";
import type { AuthUser, LoginRequest, RegisterRequest } from "@/types/api";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthUser, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["CurrentUser"],
    }),

    register: builder.mutation<AuthUser, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["CurrentUser"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["CurrentUser"],
    }),

    getCurrentUser: builder.query<AuthUser, void>({
      query: () => "/auth/me",
      providesTags: ["CurrentUser"],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation, useGetCurrentUserQuery } = authApi;
