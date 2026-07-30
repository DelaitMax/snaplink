export interface CreateLinkRequest {
  url: string;
  alias?: string;
  ttlSeconds?: number;
}

export interface CreateLinkResponse {
  shortCode: string;
  shareUrl: string;
  statsUrl: string;
  originalUrl: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface ClickByDay {
  day: string;
  count: number;
}

export interface DeviceBreakdown {
  deviceType: string;
  count: number;
}

export interface BrowserBreakdown {
  browser: string | null;
  count: number;
}

export interface OsBreakdown {
  os: string | null;
  count: number;
}

export interface LinkStatsResponse {
  shortCode: string;
  shareUrl: string;
  originalUrl: string;
  isActive: boolean;
  isCustomAlias: boolean;
  expiresAt: string | null;
  createdAt: string;
  stats: {
    totalClicks: number;
    clicksByDay: ClickByDay[];
    deviceBreakdown: DeviceBreakdown[];
    browserBreakdown: BrowserBreakdown[];
    osBreakdown: OsBreakdown[];
  };
}

export interface ClickListItem {
  clickedAt: string;
  country: string | null;
  region: string | null;
  city: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuthUser {
  id: number;
  email: string;
  role: "admin" | "user";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AdminLinkListItem {
  id: number;
  shortCode: string;
  originalUrl: string;
  isActive: boolean;
  isCustomAlias: boolean;
  expiresAt: string | null;
  createdAt: string;
  clicks: number;
}

// "Мои ссылки" — как AdminLinkListItem, но плюс statsToken: владелец может
// перейти на свою страницу статистики (тот же капабилити-токен, что и в
// shareUrl/statsUrl при создании — просто виден и здесь, раз мы уже знаем,
// что это его ссылка).
export interface MyLinkListItem extends AdminLinkListItem {
  statsToken: string;
}

export interface TopLink {
  shortCode: string;
  originalUrl: string;
  clicks: number;
}

export interface GlobalStats {
  totalLinks: number;
  totalClicks: number;
  clicksByDay: ClickByDay[];
  deviceBreakdown: DeviceBreakdown[];
  browserBreakdown: BrowserBreakdown[];
  osBreakdown: OsBreakdown[];
  topLinks: TopLink[];
}

export interface ApiErrorBody {
  error: {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
  };
}
