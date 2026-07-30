import { api } from "@/services/api";
import type {
  ClickListItem,
  CreateLinkRequest,
  CreateLinkResponse,
  LinkStatsResponse,
  MyLinkListItem,
  PaginatedResult,
} from "@/types/api";

export const linksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createLink: builder.mutation<CreateLinkResponse, CreateLinkRequest>({
      query: (body) => ({ url: "/api/links", method: "POST", body }),
      invalidatesTags: ["MyLinks"],
    }),

    getLinkStats: builder.query<LinkStatsResponse, string>({
      query: (statsToken) => `/api/links/${statsToken}/stats`,
      providesTags: (_result, _error, statsToken) => [{ type: "LinkStats", id: statsToken }],
    }),

    getLinkClicks: builder.query<
      PaginatedResult<ClickListItem>,
      { statsToken: string; page: number; pageSize: number }
    >({
      query: ({ statsToken, page, pageSize }) => `/api/links/${statsToken}/clicks?page=${page}&pageSize=${pageSize}`,
      providesTags: (_result, _error, arg) => [{ type: "LinkClicks", id: arg.statsToken }],
    }),

    getMyLinks: builder.query<PaginatedResult<MyLinkListItem>, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => `/api/links/mine?page=${page}&pageSize=${pageSize}`,
      providesTags: ["MyLinks"],
    }),

    deactivateLink: builder.mutation<{ shortCode: string; isActive: boolean }, string>({
      query: (statsToken) => ({ url: `/api/links/${statsToken}/deactivate`, method: "POST" }),
      invalidatesTags: (_result, _error, statsToken) => [
        { type: "LinkStats", id: statsToken },
        "AdminLinks",
        "AdminStats",
        "MyLinks",
      ],
    }),
  }),
});

export const {
  useCreateLinkMutation,
  useGetLinkStatsQuery,
  useGetLinkClicksQuery,
  useGetMyLinksQuery,
  useDeactivateLinkMutation,
} = linksApi;

export function linkClicksExportUrl(statsToken: string): string {
  return `/api/links/${statsToken}/clicks/export`;
}
