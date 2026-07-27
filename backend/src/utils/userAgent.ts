import { UAParser } from "ua-parser-js";
import { isbot } from "isbot";

export type DeviceCategory = "desktop" | "mobile" | "tablet" | "other";

export interface ParsedUserAgent {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: DeviceCategory;
  isBot: boolean;
}

function toDeviceCategory(deviceType: string | undefined): DeviceCategory {
  if (!deviceType) return "desktop";
  if (deviceType === "mobile") return "mobile";
  if (deviceType === "tablet") return "tablet";
  return "other";
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const result = UAParser(userAgent);

  return {
    browser: result.browser.name ?? null,
    browserVersion: result.browser.version ?? null,
    os: result.os.name ?? null,
    osVersion: result.os.version ?? null,
    deviceType: toDeviceCategory(result.device.type),
    isBot: isbot(userAgent),
  };
}
