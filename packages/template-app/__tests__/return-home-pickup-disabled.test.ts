import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";
import { setupReturnMocks } from "./helpers/return";

afterEach(() => jest.resetModules());

describe("/api/return home pickup disabled", () => {
  test("home pickup disabled when setting false", async () => {
    setupReturnMocks();
    jest.doMock("@platform-core/returnLogistics", () => ({
      __esModule: true,
      getReturnBagAndLabel: jest
        .fn()
        .mockResolvedValue({ homePickupZipCodes: ["12345"] }),
    }));
    jest.doMock("@platform-core/repositories/settings.server", () => ({
      __esModule: true,
      getShopSettings: jest
        .fn()
        .mockResolvedValue({ returnService: { homePickupEnabled: false } }),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ zip: "12345", date: "2023-01-01", time: "10:00" }),
    } as unknown as NextRequest);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Home pickup disabled" });
  });
});
