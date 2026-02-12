import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("runSeoAudit", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("throws when chrome launch function is unavailable", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("lighthouse", () => jest.fn(), { virtual: true });
      jest.doMock("chrome-launcher", () => ({}), { virtual: true });
      jest.doMock(
        "lighthouse/core/config/desktop-config.js",
        () => ({ default: {} }),
        { virtual: true },
      );

      const { runSeoAudit } = await import("../seoAudit");
      await expect(runSeoAudit("https://example.com")).rejects.toThrow(
        "chrome-launcher launch function not available",
      );
    });
  });

  it("throws when lighthouse export is not a function", async () => {
    await jest.isolateModulesAsync(async () => {
      const chrome = { port: 9222, kill: jest.fn(() => Promise.resolve(undefined)) };
      jest.doMock(
        "chrome-launcher",
        () => ({ launch: jest.fn(() => Promise.resolve(chrome)) }),
        { virtual: true },
      );
      jest.doMock("lighthouse", () => ({ default: {} }), { virtual: true });
      jest.doMock(
        "lighthouse/core/config/desktop-config.js",
        () => ({ default: {} }),
        { virtual: true },
      );

      const { runSeoAudit } = await import("../seoAudit");
      await expect(runSeoAudit("https://example.com")).rejects.toThrow("lighthouse is not a function");
    });
  });

  it("throws when desktop config cannot be resolved", async () => {
    await jest.isolateModulesAsync(async () => {
      const chrome = { port: 9222, kill: jest.fn(() => Promise.resolve(undefined)) };
      jest.doMock(
        "chrome-launcher",
        () => ({ launch: jest.fn(() => Promise.resolve(chrome)) }),
        { virtual: true },
      );
      const lighthouseFn = jest.fn();
      jest.doMock("lighthouse", () => lighthouseFn, { virtual: true });
      jest.doMock(
        "lighthouse/core/config/desktop-config.js",
        () => {
          throw new Error("missing");
        },
        { virtual: true },
      );

      const { runSeoAudit } = await import("../seoAudit");
      await expect(runSeoAudit("https://example.com")).rejects.toThrow(
        "lighthouse desktop config not available",
      );
    });
  });

  it("throws when Lighthouse returns no result", async () => {
    await jest.isolateModulesAsync(async () => {
      const chrome = { port: 9333, kill: jest.fn(() => Promise.resolve(undefined)) };
      const launch = jest.fn(() => Promise.resolve(chrome));
      const lighthouseFn = jest.fn(() => Promise.resolve(undefined));

      jest.doMock("lighthouse", () => lighthouseFn, { virtual: true });
      jest.doMock("chrome-launcher", () => ({ launch }), { virtual: true });
      jest.doMock(
        "lighthouse/core/config/desktop-config.js",
        () => ({ default: {} }),
        { virtual: true },
      );

      const { runSeoAudit } = await import("../seoAudit");
      await expect(runSeoAudit("https://example.net")).rejects.toThrow(
        "Lighthouse did not return a result",
      );
      expect(chrome.kill).toHaveBeenCalledTimes(1);
    });
  });

  it("returns audit results with recommendations", async () => {
    await jest.isolateModulesAsync(async () => {
      const chrome = { port: 9222, kill: jest.fn(() => Promise.resolve(undefined)) };
      const launch = jest.fn(() => Promise.resolve(chrome));
      const lighthouseFn = jest.fn(() => Promise.resolve({
        lhr: {
          categories: { seo: { score: 0.91 } },
          audits: {
            pass: { score: 1, scoreDisplayMode: "binary", title: "pass" },
            fail: { score: 0, scoreDisplayMode: "binary", title: "Improve alt text" },
            na: { score: 0, scoreDisplayMode: "notApplicable", title: "N/A" },
          },
        },
      }));

      jest.doMock("lighthouse", () => lighthouseFn, { virtual: true });
      jest.doMock("chrome-launcher", () => ({ launch }), { virtual: true });
      jest.doMock(
        "lighthouse/core/config/desktop-config.js",
        () => ({ default: { extends: "lighthouse:default" } }),
        { virtual: true },
      );

      const { runSeoAudit } = await import("../seoAudit");
      const result = await runSeoAudit("https://example.com");

      expect(result).toEqual({ score: 91, recommendations: ["Improve alt text"] });
      expect(launch).toHaveBeenCalledWith({
        chromeFlags: ["--headless", "--host-resolver-rules=MAP localhost 127.0.0.1"],
      });
      expect(chrome.kill).toHaveBeenCalledTimes(1);
      expect(lighthouseFn).toHaveBeenCalledTimes(1);
      const [urlArg, optsArg, configArg] = (lighthouseFn as unknown as jest.Mock).mock.calls[0];
      expect(urlArg).toBe("https://example.com");
      expect(optsArg).toMatchObject({ onlyCategories: ["seo"], port: chrome.port });
      if (configArg && typeof configArg === "object") {
        const normalized = (configArg as { default?: unknown }).default ?? configArg;
        expect(normalized).toMatchObject({ extends: "lighthouse:default" });
      } else {
        throw new Error("Expected desktop config object");
      }
    });
  });

  it("supports direct function exports and plain config modules", async () => {
    await jest.isolateModulesAsync(async () => {
      const chrome = { port: 9223, kill: jest.fn(() => Promise.resolve(undefined)) };
      const launch = jest.fn(() => Promise.resolve(chrome));
      const lighthouseFn = jest.fn(() => Promise.resolve({
        lhr: {
          categories: { seo: { score: 0.5 } },
          audits: {
            fail: { score: 0, scoreDisplayMode: "binary", title: "Fix meta" },
          },
        },
      }));

      const actualTslib = jest.requireActual("tslib") as object;
      jest.doMock(
        "tslib",
        () => ({
          ...actualTslib,
          __importStar: (mod: unknown) => mod,
        }),
        { virtual: true },
      );
      jest.doMock("lighthouse", () => lighthouseFn, { virtual: true });
      jest.doMock("chrome-launcher", () => ({ launch }), { virtual: true });
      jest.doMock(
        "lighthouse/core/config/desktop-config.js",
        () => ({ extends: "direct" }),
        { virtual: true },
      );

      const { runSeoAudit } = await import("../seoAudit");
      const result = await runSeoAudit("https://example.org");

      expect(result).toEqual({ score: 50, recommendations: ["Fix meta"] });
      expect(lighthouseFn).toHaveBeenCalledTimes(1);
    });
  });

  it("defaults the SEO score to zero when the category is missing", async () => {
    await jest.isolateModulesAsync(async () => {
      const chrome = { port: 9224, kill: jest.fn(() => Promise.resolve(undefined)) };
      const launch = jest.fn(() => Promise.resolve(chrome));
      const lighthouseFn = jest.fn(() => Promise.resolve({
        lhr: {
          categories: {},
          audits: {
            missing: { score: 0, scoreDisplayMode: "binary", title: "Add descriptions" },
          },
        },
      }));

      jest.doMock("lighthouse", () => lighthouseFn, { virtual: true });
      jest.doMock("chrome-launcher", () => ({ launch }), { virtual: true });
      jest.doMock(
        "lighthouse/core/config/desktop-config.js",
        () => ({ default: {} }),
        { virtual: true },
      );

      const { runSeoAudit } = await import("../seoAudit");
      const result = await runSeoAudit("https://example.dev");

      expect(result).toEqual({ score: 0, recommendations: ["Add descriptions"] });
      expect(lighthouseFn).toHaveBeenCalledTimes(1);
    });
  });
});

