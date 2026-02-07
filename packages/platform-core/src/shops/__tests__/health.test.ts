import { describe, expect, it, jest } from "@jest/globals";

import type { DeployInfo } from "../deployInfo";
import * as health from "../health";

jest.mock("../deployInfo", () => {
  const actual = jest.requireActual("../deployInfo");
  return {
    ...actual,
    readDeployInfo: jest.fn(),
  };
});

const { readDeployInfo } = jest.requireMock("../deployInfo") as {
  readDeployInfo: jest.Mock;
};

describe("deriveOperationalHealth", () => {
  let latestUpgrade: jest.SpyInstance;
  let healthJson: jest.SpyInstance;

  beforeEach(() => {
    readDeployInfo.mockReset();
    jest.restoreAllMocks();
    latestUpgrade = jest
      .spyOn(health.healthReaders, "readLatestUpgrade")
      .mockReturnValue(null);
    healthJson = jest
      .spyOn(health.healthReaders, "readHealthJson")
      .mockReturnValue(null);
  });

  it("returns needs-attention when deploy info is missing", async () => {
    readDeployInfo.mockReturnValueOnce(null);
    const summary = await health.deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("needs-attention");
    expect(summary.reasons[0]?.code).toBe("deploy-missing");
  });

  it("treats deploy error as broken", async () => {
    const info: DeployInfo = { status: "error" };
    readDeployInfo.mockReturnValueOnce(info);
    const summary = await health.deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("broken");
    expect(summary.reasons.map((r) => r.code)).toContain("deploy-error");
  });

  it("treats failed tests as broken even when deploy succeeded", async () => {
    const info: DeployInfo = {
      status: "success",
      testsStatus: "failed",
    };
    readDeployInfo.mockReturnValueOnce(info);
    const summary = await health.deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("broken");
    expect(summary.reasons.map((r) => r.code)).toContain("tests-failed");
  });

  it("treats not-run tests as needs-attention", async () => {
    const info: DeployInfo = {
      status: "success",
      testsStatus: "not-run",
    };
    readDeployInfo.mockReturnValueOnce(info);
    const summary = await health.deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("needs-attention");
    expect(summary.reasons.map((r) => r.code)).toContain("tests-not-run");
  });

  it("returns healthy when deploy succeeded and tests passed", async () => {
    const info: DeployInfo = {
      status: "success",
      testsStatus: "passed",
    };
    readDeployInfo.mockReturnValueOnce(info);
    const summary = await health.deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("healthy");
    expect(summary.reasons.length).toBe(0);
  });

  it("adds upgrade-failed reason and pending status when last upgrade failed", async () => {
    const info: DeployInfo = {
      status: "success",
      testsStatus: "passed",
    };
    readDeployInfo.mockReturnValueOnce(info);
    latestUpgrade.mockReturnValueOnce({
      status: "failed",
      timestamp: "2025-01-01T00:00:00.000Z",
    });
    healthJson.mockReturnValueOnce(null);
    const summary = await health.deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("needs-attention");
    expect(summary.reasons.map((r) => r.code)).toContain("upgrade-failed");
    expect(summary.upgradeStatus).toBe("pending");
    expect(summary.lastUpgradeTimestamp).toBe("2025-01-01T00:00:00.000Z");
  });

  it("includes recent-errors reason when health.json has recent errors", async () => {
    const info: DeployInfo = {
      status: "success",
      testsStatus: "passed",
    };
    readDeployInfo.mockReturnValueOnce(info);
    latestUpgrade.mockReturnValueOnce(null);
    const now = new Date().toISOString();
    healthJson.mockReturnValueOnce({
      recentErrorCount: 3,
      lastErrorAt: now,
    });
    const summary = await health.deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("needs-attention");
    expect(summary.reasons.map((r) => r.code)).toContain("recent-errors");
    expect(summary.errorCount).toBe(3);
    expect(summary.lastErrorAt).toBe(now);
  });
});
