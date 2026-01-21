/**
 * Tests for launch-shop report generation.
 * @jest-environment node
 */

import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import {
  generateLaunchId,
  generateReport,
  printExecutionPlan,
  type GenerateReportParams,
} from "../../src/launch-shop/steps/report";
import type { LaunchConfig } from "@acme/platform-core/createShop";
import type { DeployResult, StepResult } from "../../src/launch-shop/types";

// Mock execSync for git commands
jest.mock("node:child_process", () => ({
  execSync: jest.fn(() => Buffer.from("abc123def456")),
}));

// Mock getShopAppSlug
jest.mock("@acme/platform-core/shops", () => ({
  getShopAppSlug: (shopId: string) => `shop-${shopId}`,
}));

describe("generateLaunchId", () => {
  it("generates unique IDs", () => {
    const id1 = generateLaunchId();
    const id2 = generateLaunchId();

    expect(id1).not.toBe(id2);
  });

  it("generates IDs with expected format", () => {
    const id = generateLaunchId();

    // Format: YYYYMMDDHHMMSS-<7char-hash>
    // Example: 20260118143052-a1b2c3d
    expect(id).toMatch(/^\d{14}-[a-f0-9]{7}$/);
  });

  it("includes timestamp prefix", () => {
    const id = generateLaunchId();
    const timestampPart = id.split("-")[0];

    // Should be a valid timestamp-like string
    expect(timestampPart.length).toBe(14);
    expect(parseInt(timestampPart)).toBeGreaterThan(20200000000000);
  });
});

describe("generateReport", () => {
  const testDir = join(__dirname, "test-reports");
  const mockConfig: LaunchConfig = {
    schemaVersion: 1,
    shopId: "test-shop",
    deployTarget: {
      type: "cloudflare-pages",
      projectName: "test-shop",
    },
    smokeChecks: [
      { endpoint: "/", expectedStatus: 200 },
      { endpoint: "/api/health", expectedStatus: 200 },
    ],
  };

  const mockDeployResult: DeployResult = {
    workflowRunId: "12345",
    workflowRunUrl: "https://github.com/org/repo/actions/runs/12345",
    deployUrl: "https://test-shop.pages.dev",
    healthCheckPassed: true,
  };

  const mockSteps: StepResult[] = [
    { name: "preflight", status: "success", durationMs: 100 },
    { name: "scaffold", status: "success", durationMs: 5000 },
    { name: "ci-setup", status: "success", durationMs: 500 },
    { name: "deploy", status: "success", durationMs: 60000 },
  ];

  beforeAll(() => {
    // Set up test directory as data/shops location
    process.chdir(__dirname);
    mkdirSync(join(testDir, "data", "shops"), { recursive: true });
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    // Clean up any existing test shop data
    const shopDir = join("data", "shops", "shop-test-shop");
    if (existsSync(shopDir)) {
      rmSync(shopDir, { recursive: true, force: true });
    }
  });

  it("generates report with all required fields", () => {
    const params: GenerateReportParams = {
      launchId: "20260118143052-a1b2c3d",
      shopId: "test-shop",
      config: mockConfig,
      deployResult: mockDeployResult,
      mode: "preview",
      steps: mockSteps,
      startTime: Date.now() - 70000,
      smokeChecks: [
        { endpoint: "/", passed: true },
        { endpoint: "/api/health", passed: true },
      ],
    };

    const { report } = generateReport(params);

    expect(report.launchId).toBe("20260118143052-a1b2c3d");
    expect(report.shopId).toBe("test-shop");
    expect(report.mode).toBe("preview");
    expect(report.deployUrl).toBe("https://test-shop.pages.dev");
    expect(report.workflowRunUrl).toBe(
      "https://github.com/org/repo/actions/runs/12345"
    );
    expect(report.configHash).toBeDefined();
    expect(report.gitRef).toBeDefined();
    expect(report.steps).toHaveLength(4);
    expect(report.smokeChecks).toHaveLength(2);
    expect(report.startedAt).toBeDefined();
    expect(report.completedAt).toBeDefined();
    expect(report.totalDurationMs).toBeGreaterThan(0);
  });

  it("includes config hash for audit trail", () => {
    const params: GenerateReportParams = {
      launchId: "20260118143052-a1b2c3d",
      shopId: "test-shop",
      config: mockConfig,
      deployResult: mockDeployResult,
      mode: "preview",
      steps: mockSteps,
      startTime: Date.now(),
    };

    const { report } = generateReport(params);

    // Config hash should be a 12-char hex string
    expect(report.configHash).toMatch(/^[a-f0-9]{12}$/);
  });

  it("records smoke check results from execution", () => {
    const params: GenerateReportParams = {
      launchId: "20260118143052-a1b2c3d",
      shopId: "test-shop",
      config: mockConfig,
      deployResult: mockDeployResult,
      mode: "preview",
      steps: mockSteps,
      startTime: Date.now(),
      smokeChecks: [
        { endpoint: "/", passed: true },
        { endpoint: "/api/health", passed: true },
      ],
    };

    const { report } = generateReport(params);

    expect(report.smokeChecks).toEqual([
      { endpoint: "/", passed: true },
      { endpoint: "/api/health", passed: true },
    ]);
  });

  it("defaults to empty smoke checks when not provided", () => {
    const params: GenerateReportParams = {
      launchId: "20260118143052-a1b2c3d",
      shopId: "test-shop",
      config: mockConfig,
      deployResult: mockDeployResult,
      mode: "preview",
      steps: mockSteps,
      startTime: Date.now(),
    };

    const { report } = generateReport(params);

    expect(report.smokeChecks).toEqual([]);
  });

  it("writes report to correct path", () => {
    const params: GenerateReportParams = {
      launchId: "20260118143052-a1b2c3d",
      shopId: "test-shop",
      config: mockConfig,
      deployResult: mockDeployResult,
      mode: "preview",
      steps: mockSteps,
      startTime: Date.now(),
    };

    const { path: reportPath } = generateReport(params);

    expect(reportPath).toContain("data/shops/shop-test-shop/launches/");
    expect(reportPath).toContain("20260118143052-a1b2c3d.json");
    expect(existsSync(reportPath)).toBe(true);
  });

  it("writes latest launch pointer", () => {
    const params: GenerateReportParams = {
      launchId: "20260118143052-a1b2c3d",
      shopId: "test-shop",
      config: mockConfig,
      deployResult: mockDeployResult,
      mode: "preview",
      steps: mockSteps,
      startTime: Date.now(),
    };

    generateReport(params);

    const latestPath = join("data", "shops", "shop-test-shop", "launch.json");
    expect(existsSync(latestPath)).toBe(true);

    const latest = JSON.parse(readFileSync(latestPath, "utf8"));
    expect(latest.launchId).toBe("20260118143052-a1b2c3d");
  });

  it("handles missing deployResult gracefully", () => {
    const params: GenerateReportParams = {
      launchId: "20260118143052-a1b2c3d",
      shopId: "test-shop",
      config: mockConfig,
      deployResult: undefined,
      mode: "preview",
      steps: mockSteps,
      startTime: Date.now(),
    };

    const { report } = generateReport(params);

    expect(report.deployUrl).toBeUndefined();
    expect(report.workflowRunUrl).toBeUndefined();
    // Without deploy, smoke checks array should be empty
    expect(report.smokeChecks).toEqual([]);
  });

  it("calculates total duration correctly", () => {
    const startTime = Date.now() - 120000; // 2 minutes ago
    const params: GenerateReportParams = {
      launchId: "20260118143052-a1b2c3d",
      shopId: "test-shop",
      config: mockConfig,
      deployResult: mockDeployResult,
      mode: "preview",
      steps: mockSteps,
      startTime,
    };

    const { report } = generateReport(params);

    // Duration should be approximately 120000ms (2 minutes)
    expect(report.totalDurationMs).toBeGreaterThanOrEqual(120000);
    expect(report.totalDurationMs).toBeLessThan(125000); // Allow some tolerance
  });
});

describe("printExecutionPlan", () => {
  const mockConfig: LaunchConfig = {
    schemaVersion: 1,
    shopId: "test-shop",
    deployTarget: {
      type: "cloudflare-pages",
      projectName: "test-shop-project",
    },
    smokeChecks: [
      { endpoint: "/", expectedStatus: 200 },
      { endpoint: "/api/health", expectedStatus: 200 },
    ],
  };

  let consoleLogs: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    consoleLogs = [];
    console.log = jest.fn((...args) => {
      consoleLogs.push(args.join(" "));
    });
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("prints shop information", () => {
    printExecutionPlan(mockConfig);

    expect(consoleLogs.some((log) => log.includes("test-shop"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("shop-test-shop"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("cloudflare-pages"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("test-shop-project"))).toBe(true);
  });

  it("prints execution steps", () => {
    printExecutionPlan(mockConfig);

    expect(consoleLogs.some((log) => log.includes("Scaffold"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("CI workflow"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("Commit"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("deploy"))).toBe(true);
  });

  it("prints smoke checks when configured", () => {
    printExecutionPlan(mockConfig);

    expect(consoleLogs.some((log) => log.includes("Smoke checks"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("/"))).toBe(true);
    expect(consoleLogs.some((log) => log.includes("/api/health"))).toBe(true);
  });

  it("skips smoke checks section when not configured", () => {
    const configNoSmoke: LaunchConfig = {
      ...mockConfig,
      smokeChecks: undefined,
    };

    printExecutionPlan(configNoSmoke);

    expect(consoleLogs.some((log) => log.includes("Smoke checks"))).toBe(false);
  });
});

describe("report redaction", () => {
  it("does not include secret values in report", () => {
    const params: GenerateReportParams = {
      launchId: "20260118143052-a1b2c3d",
      shopId: "test-shop",
      config: {
        schemaVersion: 1,
        shopId: "test-shop",
        deployTarget: {
          type: "cloudflare-pages",
          projectName: "test-shop",
        },
      },
      deployResult: {
        workflowRunId: "12345",
        workflowRunUrl: "https://github.com/org/repo/actions/runs/12345",
        deployUrl: "https://test-shop.pages.dev",
        healthCheckPassed: true,
      },
      mode: "preview",
      steps: [],
      startTime: Date.now(),
    };

    const { report } = generateReport(params);
    const reportJson = JSON.stringify(report);

    // Ensure common secret patterns are not in the output
    expect(reportJson).not.toContain("sk_live_");
    expect(reportJson).not.toContain("sk_test_");
    expect(reportJson).not.toContain("whsec_");
    expect(reportJson).not.toContain("API_TOKEN");
    expect(reportJson).not.toContain("SECRET_KEY");

    // URLs are safe to include
    expect(reportJson).toContain("test-shop.pages.dev");
    expect(reportJson).toContain("github.com");
  });
});
