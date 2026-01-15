import { afterEach, describe, expect, it } from "vitest";

const ORIGINAL_ENV = { ...import.meta.env } as Record<string, any>;
const originalWindow = globalThis.window;

afterEach(() => {
  Object.assign(import.meta.env, ORIGINAL_ENV);
  globalThis.window = originalWindow;
});

describe("cfLibImage buildCfImageUrl", () => {
  it("returns raw path in DEV", async () => {
    Object.assign(import.meta.env, { DEV: true });
    const { default: buildCfImageUrl } = await import("@/lib/cfLibImage");
    expect(buildCfImageUrl("/img/cat.webp", { width: 100 })).toBe("/img/cat.webp");
  });

  it("prefers env origin when provided", async () => {
    Object.assign(import.meta.env, { DEV: false, VITE_SITE_ORIGIN: "https://media.example" });
    const { default: buildCfImageUrl } = await import("@/lib/cfLibImage");
    const url = buildCfImageUrl("/img/dog.webp", { height: 400 });
    expect(url.startsWith("https://media.example/cdn-cgi/image/")).toBe(true);
    expect(url).toContain("height=400");
    expect(url).toContain("quality=85");
    expect(url).toContain("format=auto");
  });

  it("uses hostOverride when passed", async () => {
    Object.assign(import.meta.env, { DEV: false, VITE_SITE_ORIGIN: "" });
    const { default: buildCfImageUrl } = await import("@/lib/cfLibImage");
    const url = buildCfImageUrl("/img/bird.webp", { width: 640 }, "img.host");
    expect(url.startsWith("https://img.host/cdn-cgi/image/")).toBe(true);
  });

  it("falls back to relative path when no origin and no window", async () => {
    Object.assign(import.meta.env, { DEV: false, VITE_SITE_ORIGIN: "" });
    globalThis.window = undefined as unknown as Window;
    const { default: buildCfImageUrl } = await import("@/lib/cfLibImage");
    const url = buildCfImageUrl("/img/fox.webp", { width: 200 });
    expect(url.startsWith("/cdn-cgi/image/")).toBe(true);
    expect(url).toContain("width=200");
  });

  it("handles absolute remote URLs without stripping", async () => {
    Object.assign(import.meta.env, { DEV: false, VITE_SITE_ORIGIN: "" });
    const { default: buildCfImageUrl } = await import("@/lib/cfLibImage");
    const remote = "https://images.example.com/p/cat.webp";
    const url = buildCfImageUrl(remote, { width: 320 }, "assets.example");
    expect(url).toContain("/cdn-cgi/image/");
    expect(url.endsWith(remote)).toBe(true);
  });
});