import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

// uploaderLog is NOT mocked here — we are testing the real implementation.
// We temporarily override NODE_ENV to bypass the suppression gate for most TCs.

describe("uploaderLogger", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  // TC-LOG-01: JSON-parseable line written to stdout with correct shape
  it("TC-LOG-01: emits a JSON-parseable line via console.info with correct shape", async () => {
    process.env.NODE_ENV = "production";
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});

    const { uploaderLog } = await import("../uploaderLogger");
    uploaderLog("info", "test_event", { key: "value" });

    expect(spy).toHaveBeenCalledTimes(1);
    const raw = (spy.mock.calls[0] as [string])[0];
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("test_event");
    expect(parsed.key).toBe("value");
    expect(typeof parsed.ts).toBe("string");
    // ts should be ISO 8601
    expect(() => new Date(parsed.ts as string).toISOString()).not.toThrow();
  });

  // TC-LOG-02: When NODE_ENV=test, no output is emitted (suppression gate)
  it("TC-LOG-02: suppresses all output when NODE_ENV is test", async () => {
    process.env.NODE_ENV = "test";
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { uploaderLog } = await import("../uploaderLogger");
    uploaderLog("info", "test_event");
    uploaderLog("warn", "test_event");
    uploaderLog("error", "test_event");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  // TC-LOG-03: Circular-reference context does NOT throw; emits valid fallback JSON
  it("TC-LOG-03: handles circular-reference context without throwing, emits fallback record", async () => {
    process.env.NODE_ENV = "production";
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});

    const { uploaderLog } = await import("../uploaderLogger");
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => uploaderLog("info", "fallback_test", circular)).not.toThrow();

    expect(spy).toHaveBeenCalledTimes(1);
    const raw = (spy.mock.calls[0] as [string])[0];
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("fallback_test");
    expect(typeof parsed.ts).toBe("string");
    // The circular key should not be present in the fallback record
    expect(parsed.self).toBeUndefined();
  });

  // TC-LOG-04: warn/error levels call the correct console method, not console.info
  it("TC-LOG-04: routes warn level to console.warn and error level to console.error", async () => {
    process.env.NODE_ENV = "production";
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { uploaderLog } = await import("../uploaderLogger");
    uploaderLog("warn", "warn_event");
    uploaderLog("error", "error_event");

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const warnRaw = (warnSpy.mock.calls[0] as [string])[0];
    const warnParsed = JSON.parse(warnRaw) as Record<string, unknown>;
    expect(warnParsed.level).toBe("warn");
    expect(warnParsed.event).toBe("warn_event");

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const errorRaw = (errorSpy.mock.calls[0] as [string])[0];
    const errorParsed = JSON.parse(errorRaw) as Record<string, unknown>;
    expect(errorParsed.level).toBe("error");
    expect(errorParsed.event).toBe("error_event");

    expect(infoSpy).not.toHaveBeenCalled();
  });
});
