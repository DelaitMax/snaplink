export const SHORT_CODE_LENGTH = 7;
export const STATS_TOKEN_LENGTH = 16;

export const ALIAS_MIN_LENGTH = 3;
export const ALIAS_MAX_LENGTH = 32;
export const ALIAS_CHARS_REGEX = /^[a-zA-Z0-9_-]+$/;

export const GLOBAL_RATE_LIMIT_WINDOW_MS = 60_000;
export const GLOBAL_RATE_LIMIT_MAX = 100;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60_000;
export const AUTH_RATE_LIMIT_MAX = 10;

export const STATS_WINDOW_DAYS = 30;
export const TOP_LINKS_LIMIT = 10;
export const CLICK_EXPORT_MAX_ROWS = 50_000;

export const MAX_LINK_TTL_SECONDS = 60 * 60 * 24 * 365 * 5;
