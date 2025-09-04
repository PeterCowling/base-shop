import { jest } from "@jest/globals";

describe("telemetry index", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_ENABLE_TELEMETRY;
    delete process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE;
    delete process.env.NODE_ENV;
    // restore fetch if mocked
    // @ts-ignore
    if (originalFetch) global.fetch = originalFetch;
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

  test("__flush sends buffered events and retries on failure", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    process.env.NODE_ENV = "production";
    const mod = await import("../index");
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ ok: true } as any);
    originalFetch = global.fetch;
    // @ts-ignore
    global.fetch = fetchMock;
    mod.track("evt", { foo: "bar" });
    await mod.__flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body[0].name).toBe("evt");
    expect(mod.__buffer.length).toBe(0);
  });

  test("__stripPII removes sensitive keys", async () => {
    const mod = await import("../index");
    expect(
      mod.__stripPII({ email: "a@b.com", password: "secret", keep: 1 })
    ).toEqual({ keep: 1 });
  });
});

