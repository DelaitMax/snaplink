import { customAlphabet } from "nanoid";
import {
  ALIAS_CHARS_REGEX,
  ALIAS_MAX_LENGTH,
  ALIAS_MIN_LENGTH,
  SHORT_CODE_LENGTH,
  STATS_TOKEN_LENGTH,
} from "@/constants";

const ALPHABET = "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

const generateShortCode = customAlphabet(ALPHABET, SHORT_CODE_LENGTH);
const generateStatsToken = customAlphabet(ALPHABET, STATS_TOKEN_LENGTH);

export function createShortCode(): string {
  return generateShortCode();
}

export function createStatsToken(): string {
  return generateStatsToken();
}

const RESERVED_ALIASES = new Set(["api", "health", "stats", "static", "assets", "favicon.ico"]);

export function isValidAlias(alias: string): boolean {
  return alias.length >= ALIAS_MIN_LENGTH && alias.length <= ALIAS_MAX_LENGTH && ALIAS_CHARS_REGEX.test(alias);
}

export function isReservedAlias(alias: string): boolean {
  return RESERVED_ALIASES.has(alias.toLowerCase());
}
