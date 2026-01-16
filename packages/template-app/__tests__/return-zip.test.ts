import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";
import { setupReturnMocks } from "./helpers/return";

afterEach(() => jest.resetModules());

describe("/api/return zip", () => {
  test("rejects ZIP not eligible for pickup", async () => {
    setupReturnMocks();
    jest.doMock("@acme/platform-core/returnLogistics", () => ({
      __esModule: true,
      getReturnBagAndLabel: jest
        .fn()
        .mockResolvedValue({ homePickupZipCodes: ["99999"] }),
    }));
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      __esModule: true,
      getShopSettings: jest
        .fn()
        .mockResolvedValue({ returnService: { homePickupEnabled: true } }),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ zip: "12345", date: "2023-01-01", time: "10:00" }),
    } as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "ZIP not eligible" });
  });
});
