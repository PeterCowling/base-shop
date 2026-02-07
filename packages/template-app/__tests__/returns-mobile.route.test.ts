import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { setReturnTracking } from "@acme/platform-core/orders";
import { markReturned } from "@acme/platform-core/repositories/rentalOrders.server";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import {
  getReturnBagAndLabel,
  getReturnLogistics,
} from "@acme/platform-core/returnLogistics";

// Ensure Response.json exists for NextResponse
const ResponseWithJson = Response as unknown as typeof Response & {
  json?: (data: unknown, init?: ResponseInit) => Response;
};
if (typeof ResponseWithJson.json !== "function") {
  ResponseWithJson.json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  readShop: jest.fn(),
}));

jest.mock("@acme/platform-core/returnLogistics", () => ({
  getReturnLogistics: jest.fn(),
  getReturnBagAndLabel: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/settings.server", () => ({
  getShopSettings: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/rentalOrders.server", () => ({
  markReturned: jest.fn(),
}));

jest.mock("@acme/platform-core/orders", () => ({
  setReturnTracking: jest.fn(),
}));

const makeReq = (body: object) =>
  ({
    json: async () => body,
  }) as unknown as NextRequest;

beforeEach(() => {
  (readShop as jest.Mock).mockResolvedValue({ returnsEnabled: true });
  (getReturnLogistics as jest.Mock).mockResolvedValue({ mobileApp: true });
  (getReturnBagAndLabel as jest.Mock).mockResolvedValue({
    homePickupZipCodes: ["12345"],
    returnCarrier: ["ups"],
  });
  (getShopSettings as jest.Mock).mockResolvedValue({
    returnService: { homePickupEnabled: true, upsEnabled: true },
  });
  (markReturned as jest.Mock).mockResolvedValue({});
  (setReturnTracking as jest.Mock).mockResolvedValue(undefined);
  global.fetch = jest.fn().mockResolvedValue(new Response()) as any;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("/api/returns/mobile POST", () => {
  test("returns 403 when returns disabled", async () => {
    (readShop as jest.Mock).mockResolvedValue({ returnsEnabled: false });
    const { POST } = await import("../src/api/returns/mobile/route");
    const res = await POST(makeReq({ sessionId: "sess" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Returns disabled" });
  });

  test("returns 403 when mobile returns disabled", async () => {
    (getReturnLogistics as jest.Mock).mockResolvedValue({ mobileApp: false });
    const { POST } = await import("../src/api/returns/mobile/route");
    const res = await POST(makeReq({ sessionId: "sess" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Mobile returns disabled" });
  });

  test("returns 400 when sessionId missing", async () => {
    const { POST } = await import("../src/api/returns/mobile/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing sessionId" });
  });

  test("returns 403 when home pickup disabled", async () => {
    (getShopSettings as jest.Mock).mockResolvedValue({
      returnService: { homePickupEnabled: false },
    });
    const { POST } = await import("../src/api/returns/mobile/route");
    const res = await POST(makeReq({ sessionId: "sess", zip: "12345" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Home pickup disabled" });
  });

  test("returns 400 when ZIP not eligible", async () => {
    (getReturnBagAndLabel as jest.Mock).mockResolvedValue({
      homePickupZipCodes: ["99999"],
      returnCarrier: ["ups"],
    });
    const { POST } = await import("../src/api/returns/mobile/route");
    const res = await POST(makeReq({ sessionId: "sess", zip: "12345" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "ZIP not eligible" });
  });

  test("returns 404 when order not found", async () => {
    (markReturned as jest.Mock).mockResolvedValue(null);
    const { POST } = await import("../src/api/returns/mobile/route");
    const res = await POST(makeReq({ sessionId: "sess" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Order not found" });
  });

  test("creates UPS label when enabled", async () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.123456789);
    const { POST } = await import("../src/api/returns/mobile/route");
    const res = await POST(makeReq({ sessionId: "sess" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.tracking).toBe("1Z123456789");
    expect(data.labelUrl).toBe(
      "https://www.ups.com/track?loc=en_US&tracknum=1Z123456789",
    );
    expect(setReturnTracking).toHaveBeenCalledWith(
      "bcd",
      "sess",
      "1Z123456789",
      "https://www.ups.com/track?loc=en_US&tracknum=1Z123456789",
    );
    randomSpy.mockRestore();
  });
});

