import { jest } from "@jest/globals";

describe("telemetry index", () => {
  let originalFetch: typeof fetch;
  let telemetry: typeof import("@acme/telemetry/index");

  beforeEach(async () => {
    originalFetch = global.fetch;
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    jest.spyOn(Math, "random").mockReturnValue(0);
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
    telemetry = await import("@acme/telemetry/index");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.resetModules();
    telemetry.__buffer.splice(0, telemetry.__buffer.length);
    delete process.env.NEXT_PUBLIC_ENABLE_TELEMETRY;
    delete process.env.NODE_ENV;
  });

  it("emits navigation and cart events", async () => {
    telemetry.track("page:navigate", { to: "/products" });
    telemetry.track("cart:add", { sku: "123" });

    await telemetry.__flush();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body as string
    );
    expect(body.map((e: any) => e.name)).toEqual([
      "page:navigate",
      "cart:add",
    ]);
  });
});
