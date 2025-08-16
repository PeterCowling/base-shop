// apps/shop-abc/__tests__/returnApi.test.ts
import type { NextRequest } from "next/server";

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("/api/return", () => {
  test("creates label and stores tracking", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) } as any);

    jest.doMock("@platform-core/shipping", () => ({
      __esModule: true,
      createUpsReturnLabel: jest
        .fn()
        .mockResolvedValue({ trackingNumber: "1ZTEST", labelUrl: "url" }),
      getUpsStatus: jest.fn(),
    }));
    jest.doMock("@platform-core/orders", () => ({
      __esModule: true,
      setReturnTracking: jest.fn(),
      setReturnStatus: jest.fn(),
    }));
    jest.doMock("@platform-core/returnLogistics", () => ({
      __esModule: true,
      getReturnLogistics: jest.fn().mockResolvedValue({
        labelService: "ups",
        returnCarrier: ["ups"],
      }),
    }));
    jest.doMock("@shared-utils", () => ({
      __esModule: true,
      parseJsonBody: jest
        .fn()
        .mockResolvedValue({ success: true, data: { sessionId: "sess" } }),
    }));
    const { POST } = await import("../src/app/api/return/route");
    const res = await POST({} as NextRequest);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.tracking.number).toBe("1ZTEST");
  });

  test("returns status", async () => {
    jest.doMock("@platform-core/shipping", () => ({
      __esModule: true,
      createUpsReturnLabel: jest.fn(),
      getUpsStatus: jest.fn().mockResolvedValue("IN_TRANSIT"),
    }));
    jest.doMock("@platform-core/orders", () => ({
      __esModule: true,
      setReturnTracking: jest.fn(),
      setReturnStatus: jest.fn(),
    }));
    jest.doMock("@platform-core/returnLogistics", () => ({
      __esModule: true,
      getReturnLogistics: jest.fn().mockResolvedValue({
        labelService: "ups",
        returnCarrier: ["ups"],
      }),
    }));
    jest.doMock("@shared-utils", () => ({
      __esModule: true,
      parseJsonBody: jest.fn().mockResolvedValue({ success: true, data: {} }),
    }));
    const { GET } = await import("../src/app/api/return/route");
    const req = {
      nextUrl: new URL("http://test?tracking=1ZTEST"),
    } as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("IN_TRANSIT");
  });
});
