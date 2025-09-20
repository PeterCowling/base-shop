// apps/shop-bcd/__tests__/delivery-api.test.ts

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

import { jsonRequest } from "@acme/test-utils";
const createRequest = (body: any = {}) => jsonRequest(body);

describe("/api/delivery", () => {
  test("returns error when premier shipping not available", async () => {
    jest.doMock("../shop.json", () => ({ shippingProviders: [] }));
    const { POST } = await import("../src/app/api/delivery/route");
    const res = await POST(createRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Premier shipping not available" });
  });

  test("schedules pickup via provider", async () => {
    jest.doMock("../shop.json", () => ({ shippingProviders: ["premier-shipping"] }));
    const schedulePickup = jest.fn();
    jest.doMock("@shared-utils", () => ({
      parseJsonBody: jest.fn().mockResolvedValue({
        success: true,
        data: { region: "US", date: "2025-01-01", window: "9-12", carrier: "UPS" },
      }),
    }));
    jest.doMock("@platform-core/plugins", () => ({
      initPlugins: jest.fn(async () => ({
        shipping: new Map([["premier-shipping", { schedulePickup }]]),
      })),
    }));
    const { POST } = await import("../src/app/api/delivery/route");
    const res = await POST(createRequest());
    expect(schedulePickup).toHaveBeenCalledWith("US", "2025-01-01", "9-12", "UPS");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("returns error when provider missing", async () => {
    jest.doMock("../shop.json", () => ({ shippingProviders: ["premier-shipping"] }));
    jest.doMock("@shared-utils", () => ({
      parseJsonBody: jest.fn().mockResolvedValue({
        success: true,
        data: { region: "US", date: "2025-01-01", window: "9-12" },
      }),
    }));
    jest.doMock("@platform-core/plugins", () => ({
      initPlugins: jest.fn(async () => ({ shipping: new Map() })),
    }));
    const { POST } = await import("../src/app/api/delivery/route");
    const res = await POST(createRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Premier shipping not available" });
  });

  test("returns parse error response when body invalid", async () => {
    jest.doMock("../shop.json", () => ({ shippingProviders: ["premier-shipping"] }));
    const parseResponse = Response.json({ error: "bad" }, { status: 400 });
    jest.doMock("@shared-utils", () => ({
      parseJsonBody: jest.fn().mockResolvedValue({ success: false, response: parseResponse }),
    }));
    const { POST } = await import("../src/app/api/delivery/route");
    const res = await POST(createRequest());
    expect(res).toBe(parseResponse);
  });

  test("returns error when schedulePickup throws", async () => {
    jest.doMock("../shop.json", () => ({ shippingProviders: ["premier-shipping"] }));
    const schedulePickup = jest.fn().mockRejectedValue(new Error("boom"));
    jest.doMock("@shared-utils", () => ({
      parseJsonBody: jest.fn().mockResolvedValue({
        success: true,
        data: { region: "US", date: "2025-01-01", window: "9-12" },
      }),
    }));
    jest.doMock("@platform-core/plugins", () => ({
      initPlugins: jest.fn(async () => ({
        shipping: new Map([["premier-shipping", { schedulePickup }]]),
      })),
    }));
    const { POST } = await import("../src/app/api/delivery/route");
    const res = await POST(createRequest());
    expect(schedulePickup).toHaveBeenCalled();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});
