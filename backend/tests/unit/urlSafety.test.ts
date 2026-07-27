import { describe, expect, it } from "vitest";
import { assertSafeUrl, UnsafeUrlError } from "@/utils/urlSafety";

describe("assertSafeUrl", () => {
  it("allows a normal public https URL", async () => {
    const url = await assertSafeUrl("https://example.com/some/page");
    expect(url.hostname).toBe("example.com");
  });

  it("rejects invalid URLs", async () => {
    await expect(assertSafeUrl("not-a-url")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects non-http(s) protocols", async () => {
    await expect(assertSafeUrl("ftp://example.com/file")).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects localhost by hostname", async () => {
    await expect(assertSafeUrl("http://localhost:9999/secret")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects loopback IP literals", async () => {
    await expect(assertSafeUrl("http://127.0.0.1/admin")).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl("http://[::1]/admin")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects private IPv4 ranges", async () => {
    await expect(assertSafeUrl("http://10.0.0.5/")).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl("http://172.16.0.5/")).rejects.toThrow(UnsafeUrlError);
    await expect(assertSafeUrl("http://192.168.1.1/")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects link-local / cloud metadata IP", async () => {
    await expect(assertSafeUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects IPv4-mapped IPv6 loopback", async () => {
    await expect(assertSafeUrl("http://[::ffff:127.0.0.1]/")).rejects.toThrow(UnsafeUrlError);
  });

  it("allows a public IP literal", async () => {
    const url = await assertSafeUrl("http://93.184.216.34/");
    expect(url.hostname).toBe("93.184.216.34");
  });
});
