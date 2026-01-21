import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { setupReturnMocks } from "./helpers/return";

afterEach(() => jest.resetModules());

describe("/api/return success", () => {
  test("schedules valid home pickup", async () => {
    setupReturnMocks();
    jest.doMock("@acme/platform-core/returnLogistics", () => ({
      __esModule: true,
      getReturnBagAndLabel: jest
        .fn()
        .mockResolvedValue({ homePickupZipCodes: ["12345"] }),
    }));
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      __esModule: true,
      getShopSettings: jest
        .fn()
        .mockResolvedValue({ returnService: { homePickupEnabled: true } }),
    }));

    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    const fetchMock = jest.fn().mockResolvedValue({} as Response);
    (global as any).fetch = fetchMock;

    const { POST } = await import("../src/api/return/route");
    const appt = { zip: "12345", date: "2023-01-01", time: "10:00" };
    const res = await POST({ json: async () => appt } as unknown as NextRequest);

    expect(log).toHaveBeenCalledWith("pickup scheduled", appt);
    expect(fetchMock).toHaveBeenCalledWith("https://carrier.invalid/pickup", {
      method: "POST",
      body: JSON.stringify(appt),
    });
    expect(await res.json()).toEqual({ ok: true });
    log.mockRestore();
  });
});
