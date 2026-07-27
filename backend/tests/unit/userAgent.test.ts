import { describe, expect, it } from "vitest";
import { parseUserAgent } from "@/utils/userAgent";

const CHROME_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const SAFARI_IPAD = "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

describe("parseUserAgent", () => {
  it("parses desktop Chrome/Windows and defaults device to desktop", () => {
    const result = parseUserAgent(CHROME_WINDOWS);
    expect(result.browser).toBe("Chrome");
    expect(result.os).toBe("Windows");
    expect(result.deviceType).toBe("desktop");
    expect(result.isBot).toBe(false);
  });

  it("classifies iPhone as mobile", () => {
    const result = parseUserAgent(SAFARI_IPHONE);
    expect(result.deviceType).toBe("mobile");
    expect(result.os).toBe("iOS");
  });

  it("classifies iPad as tablet", () => {
    const result = parseUserAgent(SAFARI_IPAD);
    expect(result.deviceType).toBe("tablet");
  });

  it("flags known bots via isBot", () => {
    const result = parseUserAgent(GOOGLEBOT);
    expect(result.isBot).toBe(true);
  });
});
