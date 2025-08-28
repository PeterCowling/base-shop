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
    process.env.NODE_ENV = "production";
    const mod = await import("../index");
    mod.track("event", { a: 1 });
    expect(mod.__buffer.length).toBe(0);
  });

  test("sampling limits events", async () => {
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

  test("flush retries on failure", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "production";
    const mod = await import("../index");
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({});
    // @ts-ignore
    global.fetch = fetchMock;
    mod.track("event", { foo: "bar" });
    await mod.__flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mod.__buffer.length).toBe(0);
  });
});
