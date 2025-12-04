import { describe, expect, it, jest } from "@jest/globals";
import type { DeployInfo } from "../deployInfo";

jest.mock("../deployInfo", () => {
  const actual = jest.requireActual("../deployInfo");
  return {
    ...actual,
    readDeployInfo: jest.fn(),
  };
});

jest.mock("../health", () => {
  const actual = jest.requireActual("../health");
  return {
    ...actual,
    // we'll stub readHealthJson and readLatestUpgrade via requireMock below
  };
});

const { readDeployInfo } = jest.requireMock("../deployInfo") as {
  readDeployInfo: jest.Mock;
};
const { readLatestUpgrade, readHealthJson } = jest.requireMock("../health") as {
  readLatestUpgrade: jest.Mock;
  readHealthJson: jest.Mock;
};

describe("deriveOperationalHealth", () => {
  it("returns needs-attention when deploy info is missing", async () => {
    readDeployInfo.mockReturnValueOnce(null);
    const { deriveOperationalHealth } = await import("../health");
    const summary = await deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("needs-attention");
    expect(summary.reasons[0]?.code).toBe("deploy-missing");
  });

  it("treats deploy error as broken", async () => {
    const info: DeployInfo = { status: "error" };
    readDeployInfo.mockReturnValueOnce(info);
    const { deriveOperationalHealth } = await import("../health");
    const summary = await deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("broken");
    expect(summary.reasons.map((r) => r.code)).toContain("deploy-error");
  });

  it("treats failed tests as broken even when deploy succeeded", async () => {
    const info: DeployInfo = {
      status: "success",
      testsStatus: "failed",
    };
    readDeployInfo.mockReturnValueOnce(info);
    const { deriveOperationalHealth } = await import("../health");
    const summary = await deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("broken");
    expect(summary.reasons.map((r) => r.code)).toContain("tests-failed");
  });

  it("treats not-run tests as needs-attention", async () => {
    const info: DeployInfo = {
      status: "success",
      testsStatus: "not-run",
    };
    readDeployInfo.mockReturnValueOnce(info);
    const { deriveOperationalHealth } = await import("../health");
    const summary = await deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("needs-attention");
    expect(summary.reasons.map((r) => r.code)).toContain("tests-not-run");
  });

  it("returns healthy when deploy succeeded and tests passed", async () => {
    const info: DeployInfo = {
      status: "success",
      testsStatus: "passed",
    };
    readDeployInfo.mockReturnValueOnce(info);
    const { deriveOperationalHealth } = await import("../health");
    const summary = await deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("healthy");
    expect(summary.reasons.length).toBe(0);
  });

  it("adds upgrade-failed reason and pending status when last upgrade failed", async () => {
    const info: DeployInfo = {
      status: "success",
      testsStatus: "passed",
    };
    readDeployInfo.mockReturnValueOnce(info);
    readLatestUpgrade.mockReturnValueOnce({
      status: "failed",
      timestamp: "2025-01-01T00:00:00.000Z",
    });
    readHealthJson.mockReturnValueOnce(null);
    const { deriveOperationalHealth } = await import("../health");
    const summary = await deriveOperationalHealth("shop-1");
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
    readLatestUpgrade.mockReturnValueOnce(null);
    const now = new Date().toISOString();
    readHealthJson.mockReturnValueOnce({
      recentErrorCount: 3,
      lastErrorAt: now,
    });
    const { deriveOperationalHealth } = await import("../health");
    const summary = await deriveOperationalHealth("shop-1");
    expect(summary.status).toBe("needs-attention");
    expect(summary.reasons.map((r) => r.code)).toContain("recent-errors");
    expect(summary.errorCount).toBe(3);
    expect(summary.lastErrorAt).toBe(now);
  });
});
