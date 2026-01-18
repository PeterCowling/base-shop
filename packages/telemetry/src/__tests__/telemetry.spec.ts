import { jest } from "@jest/globals";

describe("telemetry", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_ENABLE_TELEMETRY;
    delete process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE;
    delete process.env.NODE_ENV;
  });

  test("strips PII", async () => {
    const mod = await import("../index");
    expect(
      mod.__stripPII({ email: "a@b.com", ok: 1, userName: "bob" })
    ).toEqual({ ok: 1 });
  });

  test("disabled when env flag false", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "false";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const mod = await import("../index");
    mod.track("event", { a: 1 });
    expect(mod.__buffer.length).toBe(0);
  });

  test("disabled outside production", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const mod = await import("../index");
    mod.track("event", { a: 1 });
    expect(mod.__buffer.length).toBe(0);
  });

  test("sampling limits events", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE = "0.5";
    const mod = await import("../index");
    const rand = jest.spyOn(Math, "random").mockReturnValue(0.6);
    mod.track("event1");
    expect(mod.__buffer.length).toBe(0);
    rand.mockReturnValue(0.4);
    mod.track("event2");
    expect(mod.__buffer.length).toBe(1);
  });

  test("clamps sample rate above 1", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE = "2";
    const mod = await import("../index");
    jest.spyOn(Math, "random").mockReturnValue(0.9);
    mod.track("event");
    expect(mod.__buffer.length).toBe(1);
  });

  test("clamps sample rate below 0", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE = "-1";
    const mod = await import("../index");
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    mod.track("event");
    expect(mod.__buffer.length).toBe(0);
  });

  test("defaults sample rate to 1 when NaN", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE = "not-a-number";
    const mod = await import("../index");
    jest.spyOn(Math, "random").mockReturnValue(0.99);
    mod.track("event");
    expect(mod.__buffer.length).toBe(1);
  });

  test("flush no-ops when buffer empty", async () => {
    const mod = await import("../index");
    await mod.__flush();
    expect(mod.__buffer.length).toBe(0);
  });

  test("does not schedule multiple timers", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    jest.useFakeTimers();
    const mod = await import("../index");
    const spy = jest.spyOn(global, "setTimeout");
    try {
      mod.track("event1");
      mod.track("event2");
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
      jest.useRealTimers();
    }
  });

  test("auto flushes buffered events after interval", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    jest.useFakeTimers();
    const mod = await import("../index");
    const fetchMock = jest.fn().mockResolvedValue({});
    // @ts-expect-error: override global.fetch for test
    global.fetch = fetchMock;
    try {
      mod.track("e1");
      mod.track("e2");
      expect(mod.__buffer.length).toBe(2);
      await jest.runOnlyPendingTimersAsync();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body.map((e: any) => e.name)).toEqual(["e1", "e2"]);
      expect(mod.__buffer.length).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  test("flush restores buffer after max retries", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const mod = await import("../index");
    const fetchMock = jest.fn().mockRejectedValue(new Error("fail"));
    // @ts-expect-error: override global.fetch for test
    global.fetch = fetchMock;
    mod.track("event");
    await mod.__flush();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(mod.__buffer.length).toBe(1);
  });

  test("flush retries on failure", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const mod = await import("../index");
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({});
    // @ts-expect-error: override global.fetch for test
    global.fetch = fetchMock;
    mod.track("event", { foo: "bar" });
    await mod.__flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mod.__buffer.length).toBe(0);
  });
});
