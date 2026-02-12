import { jest } from "@jest/globals";

describe("telemetry index", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_ENABLE_TELEMETRY;
    delete process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE;
    delete process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;
    delete process.env.NODE_ENV;
    delete process.env.FORCE_TELEMETRY;
    // restore fetch if mocked
    if (originalFetch) (global as any).fetch = originalFetch;
  });

  let originalFetch: typeof fetch | undefined;

  test("track respects ENABLED and SAMPLE_RATE", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE = "0.5";
    const mod = await import("../index");
    const rand = jest.spyOn(Math, "random").mockReturnValue(0.6);
    mod.track("event1");
    expect(mod.__buffer.length).toBe(0);
    rand.mockReturnValue(0.4);
    mod.track("event2");
    expect(mod.__buffer.length).toBe(1);
  });

  test("track records events at sample rate boundary", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE = "0.5";
    const mod = await import("../index");
    const rand = jest.spyOn(Math, "random").mockReturnValue(0.5);
    mod.track("boundary");
    expect(mod.__buffer.length).toBe(1);
    rand.mockReturnValue(0.50001);
    mod.track("boundary+epsilon");
    expect(mod.__buffer.map((e) => e.name)).toEqual(["boundary"]);
    rand.mockRestore();
  });

  test("__flush sends buffered events and retries on failure", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "production";
    // Suppress expected console.error from "Failed to send telemetry"
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const mod = await import("../index");
    const fetchMock = jest
      .fn<any, any[]>()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ ok: true } as any);
    originalFetch = global.fetch;
    global.fetch = fetchMock;
    mod.track("evt", { foo: "bar" });
    await mod.__flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body as string);
    expect(body[0].name).toBe("evt");
    expect(mod.__buffer.length).toBe(0);
    errorSpy.mockRestore();
  });

  test("__flush does nothing when buffer empty", async () => {
    const mod = await import("../index");
    const fetchMock = jest.fn<any, any[]>();
    originalFetch = global.fetch;
    global.fetch = fetchMock;
    await mod.__flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("__flush restores events when all retries fail", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "production";
    // Suppress expected console.error from "Failed to send telemetry"
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const mod = await import("../index");
    const fetchMock = jest.fn<any, any[]>().mockRejectedValue(new Error("fail"));
    originalFetch = global.fetch;
    global.fetch = fetchMock;
    mod.__buffer.push({ name: "evt", payload: { foo: 1 }, ts: Date.now() });
    await mod.__flush();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(mod.__buffer.map((e) => e.name)).toEqual(["evt"]);
    errorSpy.mockRestore();
  });

  test("uses custom endpoint when provided", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = "/custom-endpoint";
    const mod = await import("../index");
    const fetchMock = jest.fn<any, any[]>().mockResolvedValue({ ok: true } as any);
    originalFetch = global.fetch;
    global.fetch = fetchMock;
    mod.track("evt");
    await mod.__flush();
    expect(fetchMock).toHaveBeenCalledWith(
      "/custom-endpoint",
      expect.any(Object)
    );
  });

  test("__stripPII removes sensitive keys", async () => {
    const mod = await import("../index");
    expect(
      mod.__stripPII({ email: "a@b.com", password: "secret", keep: 1 })
    ).toEqual({ keep: 1 });
  });

  test("__stripPII filters keys case-insensitively", async () => {
    const mod = await import("../index");
    expect(mod.__stripPII({ Email: "a@b.com", ID: 2, keep: true })).toEqual({
      keep: true,
    });
  });

  test("does not send events when telemetry disabled", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "false";
    process.env.NODE_ENV = "production";
    const fetchMock = jest.fn<any, any[]>();
    originalFetch = global.fetch;
    global.fetch = fetchMock;
    const mod = await import("../index");
    mod.track("evt");
    await mod.__flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("scheduleFlush only creates a single timer", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "production";
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    try {
      const mod = await import("../index");
      mod.track("e1");
      mod.track("e2");
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    } finally {
      setTimeoutSpy.mockRestore();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  test("scheduled flush logs errors and restores buffer", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "production";
    jest.useFakeTimers();
    const fetchMock = jest.fn<any, any[]>().mockRejectedValue(new Error("fail"));
    originalFetch = global.fetch;
    global.fetch = fetchMock;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const mod = await import("../index");
      mod.track("e1");
      mod.track("e2");
      await (jest as any).runOnlyPendingTimersAsync();
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(errorSpy).toHaveBeenCalled();
      expect(mod.__buffer.map((e) => e.name)).toEqual(["e1", "e2"]);
    } finally {
      errorSpy.mockRestore();
      jest.useRealTimers();
    }
  });

  test("FORCE_TELEMETRY enables events in development", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "development";
    process.env.FORCE_TELEMETRY = "true";
    const mod = await import("../index");
    mod.track("forcedEvent");
    expect(mod.__buffer.length).toBe(1);
  });

  test("does not track when navigator is offline", async () => {
    const originalNavigator = global.navigator;
    Object.defineProperty(global, "navigator", {
      value: { onLine: false },
      configurable: true,
    });
    try {
      process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
      process.env.NODE_ENV = "production";
      const mod = await import("../index");
      mod.track("offlineEvent");
      expect(mod.__buffer.length).toBe(0);
    } finally {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    }
  });
});
