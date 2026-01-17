/** @jest-environment node */
import { readFile, resetReverseLogisticsMocks } from "./reverseLogisticsTestHelpers";

// Override the core env module with a simple mutable object for these tests
jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));

describe("resolveConfig (default data root)", () => {
  beforeEach(() => {
    jest.resetModules();
    resetReverseLogisticsMocks();
  });

  it("uses resolveDataRoot() when dataRoot arg is omitted", async () => {
    jest.doMock("@acme/platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));

    const mod = await import("../resolveConfig");

    readFile.mockResolvedValueOnce(
      JSON.stringify({ reverseLogisticsService: { enabled: true, intervalMinutes: 3 } })
    );

    const cfg = await mod.resolveConfig("shop");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 3 });
    // readFile should have been called with a path under /data
    expect(readFile).toHaveBeenCalledWith("/data/shop/settings.json", "utf8");
  });
});

