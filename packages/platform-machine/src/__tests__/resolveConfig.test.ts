/** @jest-environment node */
import {
  readFile,
  resetReverseLogisticsMocks,
} from "./reverseLogisticsTestHelpers";

// Override the core env module with a simple mutable object for these tests
jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));
import { coreEnv } from "@acme/config/env/core";

import { resolveConfig } from "../resolveConfig";

describe("resolveConfig", () => {
  beforeEach(() => {
    resetReverseLogisticsMocks();
    delete (coreEnv as any).REVERSE_LOGISTICS_ENABLED;
    delete (coreEnv as any).REVERSE_LOGISTICS_INTERVAL_MS;
    delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
    delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
    jest.restoreAllMocks();
  });

  it("applies file, env, and overrides with correct priority", async () => {
    readFile.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: false, intervalMinutes: 5 },
      })
    );
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "true";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "120000";
    const cfg = await resolveConfig("shop", "/data", {
      enabled: false,
    });
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 2 });
    delete process.env.REVERSE_LOGISTICS_ENABLED_SHOP;
    delete process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP;
  });

  it("uses coreEnv values when no env or file present", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    (coreEnv as any).REVERSE_LOGISTICS_ENABLED = true;
    (coreEnv as any).REVERSE_LOGISTICS_INTERVAL_MS = 300000; // 5 minutes
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 5 });
  });

  it("ignores invalid env values", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "maybe";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "abc";
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 60 });
  });

  it("allows override parameters to take precedence", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "false";
    process.env.REVERSE_LOGISTICS_INTERVAL_MS_SHOP = "120000";
    const cfg = await resolveConfig("shop", "/data", {
      enabled: true,
      intervalMinutes: 10,
    });
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 10 });
  });

  it("keeps default enabled when coreEnv flag is null", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    (coreEnv as any).REVERSE_LOGISTICS_ENABLED = null;
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("keeps default interval when coreEnv interval is null", async () => {
    readFile.mockRejectedValueOnce(new Error("missing"));
    (coreEnv as any).REVERSE_LOGISTICS_INTERVAL_MS = null;
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("disables service when env enabled is false", async () => {
    readFile.mockResolvedValueOnce(
      JSON.stringify({
        reverseLogisticsService: { enabled: true, intervalMinutes: 5 },
      })
    );
    process.env.REVERSE_LOGISTICS_ENABLED_SHOP = "false";
    const cfg = await resolveConfig("shop", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 5 });
  });
});

afterAll(() => {
  jest.resetModules();
  jest.unmock("fs/promises");
  jest.unmock("@acme/platform-core/repositories/rentalOrders.server");
  jest.unmock("@acme/platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@acme/platform-core/utils");
  jest.unmock("crypto");
});

