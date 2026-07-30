import net from "node:net";
import type { Request } from "express";

const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1"]);

function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  const mapped = trimmed.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return mapped?.[1] ?? trimmed;
}

function headerValue(header: string | string[] | undefined): string | undefined {
  return Array.isArray(header) ? header[0] : header;
}

function firstValidIp(candidate: string | undefined): string | null {
  if (!candidate) return null;
  const first = candidate.split(",")[0]?.trim();
  if (!first) return null;
  const normalized = normalizeIp(first);
  return net.isIP(normalized) ? normalized : null;
}

export function getClientIp(req: Request): string | null {
  const forwardedFor = firstValidIp(headerValue(req.headers["x-forwarded-for"]));
  const realIp = firstValidIp(headerValue(req.headers["x-real-ip"]));
  const socketIp = req.socket.remoteAddress ? normalizeIp(req.socket.remoteAddress) : null;

  const candidate = forwardedFor ?? realIp ?? (socketIp && net.isIP(socketIp) ? socketIp : null);

  if (!candidate || LOOPBACK_ADDRESSES.has(candidate)) {
    return null;
  }

  return candidate;
}
