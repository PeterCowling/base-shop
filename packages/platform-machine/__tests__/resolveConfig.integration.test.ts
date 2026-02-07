import { logger,readFile, resetReverseLogisticsMocks } from "../src/__tests__/reverseLogisticsTestHelpers";

export {};

jest.mock("@acme/platform-core/dataRoot", () => ({ resolveDataRoot: () => "/data" }));

let service: typeof import("@acme/platform-machine");

beforeEach(() => {
  resetReverseLogisticsMocks();
});

describe("resolveConfig (package entry)", () => {
  it("combines file, env, and override inputs", async () => {
    service = (await import("@acme/platform-machine")) as any;
    const { resolveConfig } = service as any;
    readFile.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: true, intervalMinutes: 10 },
      })
    );
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "false";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "120000";
    const cfg = await resolveConfig("shop", "/data", { enabled: true });
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 2 });
    delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
    delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
  });

  it("falls back to core env values", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: {
          REVERSE_LOGISTICS_ENABLED: true,
          REVERSE_LOGISTICS_INTERVAL_MS: 120000,
        },
        loadCoreEnv: () => ({
          REVERSE_LOGISTICS_ENABLED: true,
          REVERSE_LOGISTICS_INTERVAL_MS: 120000,
        }),
      }));
      const { resolveConfig } = (await import("@acme/platform-machine")) as any;
      delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
      delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
      const cfg = await resolveConfig("shop", "/data");
      expect(cfg).toEqual({ enabled: true, intervalMinutes: 2 });
    });
    jest.unmock("@acme/config/env/core");
    jest.resetModules();
  });
});

afterAll(() => {
  jest.resetModules();
  jest.unmock("fs/promises");
  jest.unmock("@acme/platform-core/repositories/rentalOrders.server");
  jest.unmock("@acme/platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@acme/platform-core/utils");
  jest.unmock("crypto");
  jest.unmock("@acme/platform-core/dataRoot");
});

