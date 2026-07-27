import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export interface PaginationParams {
  page: number;
  pageSize: number;
  limit: number;
  offset: number;
}

export function parsePagination(query: unknown): PaginationParams {
  const { page, pageSize } = paginationQuerySchema.parse(query);
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function buildPaginatedResult<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
