import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mockMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("themeSlice", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to the system preference when nothing is stored", async () => {
    mockMatchMedia(true);
    const { themeReducer } = await import("./themeSlice");
    expect(themeReducer(undefined, { type: "@@INIT" })).toEqual({ value: "dark" });
  });

  it("defaults to light when system preference is light", async () => {
    mockMatchMedia(false);
    const { themeReducer } = await import("./themeSlice");
    expect(themeReducer(undefined, { type: "@@INIT" })).toEqual({ value: "light" });
  });

  it("prefers a stored value over the system preference", async () => {
    mockMatchMedia(true);
    localStorage.setItem("snaplink:theme", "light");
    const { themeReducer } = await import("./themeSlice");
    expect(themeReducer(undefined, { type: "@@INIT" })).toEqual({ value: "light" });
  });

  it("toggleTheme flips the value and persists it", async () => {
    mockMatchMedia(false);
    const { themeReducer, toggleTheme } = await import("./themeSlice");
    const next = themeReducer({ value: "light" }, toggleTheme());
    expect(next.value).toBe("dark");
    expect(localStorage.getItem("snaplink:theme")).toBe("dark");
  });

  it("setTheme sets an explicit value and persists it", async () => {
    mockMatchMedia(false);
    const { themeReducer, setTheme } = await import("./themeSlice");
    const next = themeReducer({ value: "light" }, setTheme("dark"));
    expect(next.value).toBe("dark");
    expect(localStorage.getItem("snaplink:theme")).toBe("dark");
  });
});
