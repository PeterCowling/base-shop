// packages/ui/src/hooks/tryon/__tests__/analytics.test.ts
import type { TryOnCtx } from "../analytics";

describe("try-on analytics storage helpers", () => { // i18n-exempt: test titles
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  test("getTryOnCtx falls back to sessionStorage when memory is empty", async () => { // i18n-exempt: test title
    jest.resetModules();
    const analytics = await import("../analytics");
    analytics.clearTryOnCtx();
    window.sessionStorage.setItem("tryon.ctx", JSON.stringify({ productId: "from-storage", mode: "garment" } satisfies TryOnCtx));

    const ctx = analytics.getTryOnCtx();
    expect(ctx).toEqual({ productId: "from-storage", mode: "garment" });
    expect(ctx).not.toBe(analytics.getTryOnCtx());
  });

  test("setTryOnCtx merges with existing context and writes to storage", async () => { // i18n-exempt: test title
    jest.resetModules();
    const analytics = await import("../analytics");
    analytics.clearTryOnCtx();
    window.sessionStorage.clear();

    const first = analytics.setTryOnCtx({ productId: "p1" });
    expect(first).toEqual({ productId: "p1" });

    const second = analytics.setTryOnCtx({ mode: "garment" });
    expect(second).toEqual({ productId: "p1", mode: "garment" });
    expect(JSON.parse(window.sessionStorage.getItem("tryon.ctx") || "{}")).toEqual(second);
  });

  test("clearTryOnCtx resets memory even when storage removal fails", async () => { // i18n-exempt: test title
    jest.resetModules();
    const analytics = await import("../analytics");
    analytics.setTryOnCtx({ productId: "keep-me" });
    const originalRemove = window.sessionStorage.removeItem;
    window.sessionStorage.removeItem = jest.fn(() => {
      throw new Error("boom");
    });

    analytics.clearTryOnCtx();
    expect(analytics.getTryOnCtx()).toEqual({});

    window.sessionStorage.removeItem = originalRemove;
  });

  test("logTryOnEvent posts payloads and ignores fetch failures", async () => { // i18n-exempt: test title
    jest.resetModules();
    const analytics = await import("../analytics");
    analytics.clearTryOnCtx();
    analytics.setTryOnCtx({ productId: "p1", mode: "garment", idempotencyKey: "idem" });

    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    // @ts-expect-error: assigning test stub
    global.fetch = fetchMock;
    await analytics.logTryOnEvent("TryOnEnhanced", { extra: "value" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/analytics/tryon",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TryOnEnhanced",
          productId: "p1",
          mode: "garment",
          idempotencyKey: "idem",
          extra: "value",
        }),
      })
    );

    fetchMock.mockRejectedValueOnce(new Error("network"));
    await analytics.logTryOnEvent("TryOnError", { code: "500" });
  });

  test("handles execution when window is unavailable", async () => { // i18n-exempt: test title
    const originalWindow = global.window;
    // @ts-expect-error: simulate server runtime
    delete global.window;

    jest.resetModules();
    const analytics = await import("../analytics");
    expect(analytics.getTryOnCtx()).toEqual({});
    expect(analytics.setTryOnCtx({ productId: "p2" })).toEqual({ productId: "p2" });
    analytics.clearTryOnCtx();

    global.window = originalWindow;
  });

  test("read/write operations swallow storage exceptions", async () => { // i18n-exempt: test title
    jest.resetModules();
    const analytics = await import("../analytics");
    analytics.clearTryOnCtx();

    const originalGetItem = window.sessionStorage.getItem;
    window.sessionStorage.getItem = jest.fn(() => {
      throw new Error("get fail");
    });
    expect(analytics.getTryOnCtx()).toEqual({});
    window.sessionStorage.getItem = originalGetItem;

    const originalSetItem = window.sessionStorage.setItem;
    window.sessionStorage.setItem = jest.fn(() => {
      throw new Error("set fail");
    });
    expect(analytics.setTryOnCtx({ mode: "accessory" })).toEqual({ mode: "accessory" });
    window.sessionStorage.setItem = originalSetItem;
  });
});
