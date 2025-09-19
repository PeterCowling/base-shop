/** @jest-environment node */
import * as testSetup from "./testSetup";
import { resolveConfig } from "../../lateFeeService";

const { readFileMock, coreEnv } = testSetup;

describe("resolveConfig", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.LATE_FEE_ENABLED_S1;
    delete process.env.LATE_FEE_INTERVAL_MS_S1;
    (coreEnv as any).LATE_FEE_ENABLED = undefined;
    (coreEnv as any).LATE_FEE_INTERVAL_MS = undefined;
  });

  it("uses settings file values", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 30 } })
    );

    const cfg = await resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 30 });
  });

  it("honors precedence of file, env, and overrides", async () => {
    readFileMock.mockResolvedValueOnce(
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
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeeService: { intervalMinutes: 15 } })
    );
    process.env.LATE_FEE_INTERVAL_MS_S1 = "abc";
    (coreEnv as any).LATE_FEE_INTERVAL_MS = 30 * 60 * 1000;

    const cfg = await resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 15 });
  });

  it("ignores invalid env values", async () => {
    readFileMock.mockRejectedValueOnce(new Error("boom"));
    process.env.LATE_FEE_ENABLED_S1 = "maybe";
    process.env.LATE_FEE_INTERVAL_MS_S1 = "abc";

    const cfg = await resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: false, intervalMinutes: 60 });
  });

  it("falls back to core env values when settings file missing and env vars invalid", async () => {
    readFileMock.mockRejectedValueOnce(new Error("boom"));
    process.env.LATE_FEE_ENABLED_S1 = "maybe";
    process.env.LATE_FEE_INTERVAL_MS_S1 = "abc";
    (coreEnv as any).LATE_FEE_ENABLED = true;
    (coreEnv as any).LATE_FEE_INTERVAL_MS = 15 * 60 * 1000;

    const cfg = await resolveConfig("s1", "/data");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 15 });
  });
});
