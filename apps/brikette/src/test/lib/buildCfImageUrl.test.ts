
const ORIGINAL_ENV = { ...import.meta.env } as Record<string, any>;
const originalWindow = globalThis.window;

afterEach(() => {
  Object.assign(import.meta.env, ORIGINAL_ENV);
  globalThis.window = originalWindow;
});

describe("buildCfImageUrl", () => {
  it("returns raw path in DEV", async () => {
    Object.assign(import.meta.env, { DEV: true });
    const { default: buildCfImageUrl } = await import("@/lib/buildCfImageUrl");
    expect(buildCfImageUrl("/img/cat.webp", { width: 100 })).toBe("/img/cat.webp");
  });

  it("uses SSR fallback origin when no host/env is available", async () => {
    Object.assign(import.meta.env, {
      DEV: false,
      SSR: true,
      VITE_SITE_ORIGIN: "",
      SITE_ORIGIN: "",
    });
    const { default: buildCfImageUrl } = await import("@/lib/buildCfImageUrl");
    const url = buildCfImageUrl("/img/cat.webp", { width: 200 });
    expect(url).toMatch(/^https:\/\/hostel-positano.com\/cdn-cgi\/image\//);
    expect(url).toContain("width=200");
    expect(url).toContain("quality=85");
    expect(url).toContain("format=auto");
  });

  it("prefers env origin when provided", async () => {
    Object.assign(import.meta.env, {
      DEV: false,
      SSR: false,
      VITE_SITE_ORIGIN: "https://media.example",
    });
    const { default: buildCfImageUrl } = await import("@/lib/buildCfImageUrl");
    const url = buildCfImageUrl("/img/cat.webp", { height: 400 });
    expect(url.startsWith("https://media.example/cdn-cgi/image/")).toBe(true);
    expect(url).toContain("height=400");
  });

  it("uses hostOverride when passed", async () => {
    Object.assign(import.meta.env, { DEV: false, SSR: false, VITE_SITE_ORIGIN: "" });
    const { default: buildCfImageUrl } = await import("@/lib/buildCfImageUrl");
    const url = buildCfImageUrl("/img/cat.webp", { width: 1200 }, "img.host");
    expect(url.startsWith("https://img.host/cdn-cgi/image/")).toBe(true);
  });

  it("handles remote absolute URLs without stripping slashes", async () => {
    Object.assign(import.meta.env, { DEV: false, SSR: false, VITE_SITE_ORIGIN: "" });
    const { default: buildCfImageUrl } = await import("@/lib/buildCfImageUrl");
    const remote = "https://images.example.com/p/cat.webp";
    const url = buildCfImageUrl(remote, { width: 320 }, "assets.example");
    expect(url).toContain("/cdn-cgi/image/");
    expect(url.endsWith(remote)).toBe(true);
  });

  it("serializes fit/quality/format and arbitrary flags", async () => {
    Object.assign(import.meta.env, {
      DEV: false,
      SSR: false,
      VITE_SITE_ORIGIN: "cdn.example",
    });
    const { default: buildCfImageUrl } = await import("@/lib/buildCfImageUrl");
    const url = buildCfImageUrl("/p/cat.webp", {
      width: 640,
      fit: "cover",
      quality: 80,
      format: "webp",
      crop: "center",
    });
    expect(url).toContain("width=640");
    expect(url).toContain("fit=cover");
    expect(url).toContain("quality=80");
    expect(url).toContain("format=webp");
    expect(url).toContain("crop=center");
  });

  it("falls back to window.location.origin when no env or override is set", async () => {
    Object.assign(import.meta.env, { DEV: false, SSR: false, VITE_SITE_ORIGIN: "" });
    globalThis.window = { location: { origin: "https://preview.example" } } as Window;
    const { default: buildCfImageUrl } = await import("@/lib/buildCfImageUrl");
    const url = buildCfImageUrl("/img/pic.jpg", { width: 320 });
    expect(url).toContain("/cdn-cgi/image/");
    expect(url).toContain("width=320");
  });

  it("tolerates malformed relative inputs without throwing", async () => {
    Object.assign(import.meta.env, { DEV: false, SSR: false, VITE_SITE_ORIGIN: "assets.example" });
    const { default: buildCfImageUrl } = await import("@/lib/buildCfImageUrl");
    const url = buildCfImageUrl("////img//cat.webp", { width: 200 });
    expect(url).toContain("https://assets.example/cdn-cgi/image/");
    expect(url).toContain("width=200");
    expect(url.endsWith("/img//cat.webp")).toBe(true);
  });
});