import { logAnalyticsEvent } from "./client";

describe("analytics client", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
    try {
      (global as any).localStorage = {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] ?? null;
        },
        setItem(key: string, val: string) {
          this.store[key] = val;
        },
      };
    } catch {
      /* ignore */
    }
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  it("does nothing without consent", async () => {
    document.cookie = "consent.analytics=false";
    await logAnalyticsEvent({ type: "test", path: "/" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts when consent true", async () => {
    document.cookie = "consent.analytics=true";
    await logAnalyticsEvent({ type: "test", path: "/home" });
    expect(global.fetch).toHaveBeenCalled();
  });
});
