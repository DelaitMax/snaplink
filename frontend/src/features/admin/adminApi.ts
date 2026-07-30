import { api } from "@/services/api";
import type { AdminLinkListItem, GlobalStats, PaginatedResult } from "@/types/api";

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminLinks: builder.query<PaginatedResult<AdminLinkListItem>, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => `/api/admin/links?page=${page}&pageSize=${pageSize}`,
      providesTags: ["AdminLinks"],
    }),

    getGlobalStats: builder.query<GlobalStats, void>({
      query: () => "/api/admin/stats",
      providesTags: ["AdminStats"],
    }),
  }),
});

export const { useGetAdminLinksQuery, useGetGlobalStatsQuery } = adminApi;

export const adminClicksExportUrl = "/api/admin/stats/export";
