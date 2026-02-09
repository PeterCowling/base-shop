/** @jest-environment node */
const mockCoreEnv: Record<string, unknown> = {};
const mockReadFile = jest.fn();

jest.mock("@acme/config/env/core", () => ({
  coreEnv: mockCoreEnv,
}));

jest.mock("fs/promises", () => ({
  readFile: mockReadFile,
  readdir: jest.fn(),
}));

jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: jest.fn() } },
    paymentIntents: { create: jest.fn() },
  },
}));

jest.mock("@acme/platform-core/repositories/rentalOrders.server", () => ({
  readOrders: jest.fn(),
  markLateFeeCharged: jest.fn(),
}));

jest.mock("@acme/platform-core/utils", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line import/first -- imports must follow jest.mock declarations
import { resolveConfig } from "../../lateFeeService";

describe("resolveConfig", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.LATE_FEE_ENABLED_S1;
    delete process.env.LATE_FEE_INTERVAL_MS_S1;
    (mockCoreEnv as any).LATE_FEE_ENABLED = undefined;
    (mockCoreEnv as any).LATE_FEE_INTERVAL_MS = undefined;
  });

  it("uses settings file values", async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 30 } })
    );

    const cfg = await resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 30 });
  });

  it("honors precedence of file, env, and overrides", async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        lateFeeService: { enabled: false, intervalMinutes: 10 },
      })
    );
    process.env.LATE_FEE_ENABLED_S1 = "true";
    process.env.LATE_FEE_INTERVAL_MS_S1 = String(30 * 60 * 1000);

    const cfg = await resolveConfig("s1", "/data", {
      intervalMinutes: 5,
    });
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 5 });
  });

  it("uses file interval when env value invalid", async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({ lateFeeService: { intervalMinutes: 15 } })
    );
    process.env.LATE_FEE_INTERVAL_MS_S1 = "abc";
    (mockCoreEnv as any).LATE_FEE_INTERVAL_MS = 30 * 60 * 1000;

    const cfg = await resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 15 });
  });

  it("ignores invalid env values", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("boom"));
    process.env.LATE_FEE_ENABLED_S1 = "maybe";
    process.env.LATE_FEE_INTERVAL_MS_S1 = "abc";

    const cfg = await resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("falls back to core env values when settings file missing and env vars invalid", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("boom"));
    process.env.LATE_FEE_ENABLED_S1 = "maybe";
    process.env.LATE_FEE_INTERVAL_MS_S1 = "abc";
    (mockCoreEnv as any).LATE_FEE_ENABLED = true;
    (mockCoreEnv as any).LATE_FEE_INTERVAL_MS = 15 * 60 * 1000;

    const cfg = await resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 15 });
  });
});
