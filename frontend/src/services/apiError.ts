import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { SerializedError } from "@reduxjs/toolkit";
import type { ApiErrorBody } from "@/types/api";

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === "object" && data !== null && "error" in data;
}

export function getApiErrorMessage(
  error: FetchBaseQueryError | SerializedError | undefined,
  fallback = "Что-то пошло не так",
): string {
  if (!error) return fallback;

  if ("status" in error) {
    if (isApiErrorBody(error.data)) {
      return error.data.error.message;
    }
    if (error.status === "FETCH_ERROR") {
      return "Не удалось связаться с сервером. Проверьте соединение.";
    }
    return fallback;
  }

  return error.message ?? fallback;
}
