import { customAlphabet } from "nanoid";

const ALPHABET = "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

const generateShortCode = customAlphabet(ALPHABET, 7);
const generateStatsToken = customAlphabet(ALPHABET, 16);

export function createShortCode(): string {
  return generateShortCode();
}

export function createStatsToken(): string {
  return generateStatsToken();
}

const ALIAS_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;
const RESERVED_ALIASES = new Set(["api", "health", "stats", "static", "assets", "favicon.ico"]);

export function isValidAlias(alias: string): boolean {
  return ALIAS_REGEX.test(alias);
}

export function isReservedAlias(alias: string): boolean {
  return RESERVED_ALIASES.has(alias.toLowerCase());
}
