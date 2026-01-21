/**
 * Tests for launch-shop go-live gates.
 * @jest-environment node
 */

import { join } from "node:path";

// Mock modules before importing
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();

// Mock prisma queries
const mockPrismaCount = jest.fn();
const mockPrismaFindMany = jest.fn();

jest.mock("node:fs", () => {
  const actual = jest.requireActual("node:fs");
  return {
    ...actual,
    existsSync: (path: string) => mockExistsSync(path),
    readFileSync: (path: string, encoding: string) =>
      mockReadFileSync(path, encoding),
  };
});

jest.mock("@acme/platform-core/db", () => ({
  prisma: {
    centralInventoryItem: {
      count: () => mockPrismaCount("centralInventoryItem"),
    },
    inventoryRouting: {
      findMany: (args: unknown) => mockPrismaFindMany("inventoryRouting", args),
    },
    inventoryItem: {
      count: (args: unknown) => mockPrismaCount("inventoryItem", args),
    },
  },
}));

// Import after mocks are set up
import {
  runGoLiveGates,
  formatGateResults,
  type GoLiveGatesOptions,
} from "../../src/launch-shop/goLiveGates";
import type { LaunchConfig } from "@acme/platform-core/createShop";

describe("runGoLiveGates", () => {
  const baseConfig: LaunchConfig = {
    schemaVersion: 1,
    shopId: "test-shop",
    deployTarget: {
      type: "cloudflare-pages",
      projectName: "test-shop",
    },
    legalPages: {
      terms: "core.legal.terms.standard",
      privacy: "core.legal.privacy.standard",
      returns: "core.legal.returns.standard",
    },
    complianceSignOff: {
      signedOffBy: "test@example.com",
      signedOffAt: new Date().toISOString(),
      directorApprovedTemplates: true,
    },
  };

  const baseOptions: GoLiveGatesOptions = {
    config: baseConfig,
    shopId: "test-shop",
    mode: "preview",
    skipE2ETest: true, // Skip E2E for unit tests
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: file checks pass
    mockExistsSync.mockImplementation(() => false);
    mockReadFileSync.mockImplementation(() => "{}");

    // Default: Prisma returns valid data
    mockPrismaCount.mockImplementation((model: string) => {
      if (model === "centralInventoryItem") return Promise.resolve(10);
      if (model === "inventoryItem") return Promise.resolve(5);
      return Promise.resolve(0);
    });

    mockPrismaFindMany.mockImplementation((model: string) => {
      if (model === "inventoryRouting") {
        return Promise.resolve([
          {
            id: "routing-1",
            shopId: "test-shop",
            centralInventoryItem: { sku: "SKU-001", quantity: 10 },
          },
          {
            id: "routing-2",
            shopId: "test-shop",
            centralInventoryItem: { sku: "SKU-002", quantity: 5 },
          },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  describe("Gate 1: Centralized Inventory Routing", () => {
    it("passes when central inventory has items and routing rules exist", async () => {
      const result = await runGoLiveGates(baseOptions);
      const gate1 = result.gates.find(
        (g) => g.gate === "centralized-inventory-routing"
      );

      expect(gate1?.passed).toBe(true);
      expect(gate1?.details?.catalogItemCount).toBe(10);
      expect(gate1?.details?.routingRuleCount).toBe(2);
    });

    it("fails when central inventory is empty", async () => {
      mockPrismaCount.mockImplementation((model: string) => {
        if (model === "centralInventoryItem") return Promise.resolve(0);
        return Promise.resolve(0);
      });

      const result = await runGoLiveGates(baseOptions);
      const gate1 = result.gates.find(
        (g) => g.gate === "centralized-inventory-routing"
      );

      expect(gate1?.passed).toBe(false);
      expect(gate1?.errors).toContainEqual(
        expect.stringContaining("Central inventory is empty")
      );
    });

    it("fails when no routing rules exist for shop", async () => {
      mockPrismaFindMany.mockImplementation(() => Promise.resolve([]));

      const result = await runGoLiveGates(baseOptions);
      const gate1 = result.gates.find(
        (g) => g.gate === "centralized-inventory-routing"
      );

      expect(gate1?.passed).toBe(false);
      expect(gate1?.errors).toContainEqual(
        expect.stringContaining("No routing rules found")
      );
    });

    it("warns when routings point to zero quantity items", async () => {
      mockPrismaFindMany.mockImplementation((model: string) => {
        if (model === "inventoryRouting") {
          return Promise.resolve([
            {
              id: "routing-1",
              shopId: "test-shop",
              centralInventoryItem: { sku: "SKU-001", quantity: 0 },
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await runGoLiveGates(baseOptions);
      const gate1 = result.gates.find(
        (g) => g.gate === "centralized-inventory-routing"
      );

      expect(gate1?.passed).toBe(true); // Still passes, just warns
      expect(gate1?.warnings).toContainEqual(
        expect.stringContaining("zero quantity")
      );
    });

    it("warns when shop has routings but no synced inventory", async () => {
      mockPrismaCount.mockImplementation((model: string) => {
        if (model === "centralInventoryItem") return Promise.resolve(10);
        if (model === "inventoryItem") return Promise.resolve(0); // No synced items
        return Promise.resolve(0);
      });

      const result = await runGoLiveGates(baseOptions);
      const gate1 = result.gates.find(
        (g) => g.gate === "centralized-inventory-routing"
      );

      expect(gate1?.passed).toBe(true); // Still passes, just warns
      expect(gate1?.warnings).toContainEqual(
        expect.stringContaining("no synced inventory")
      );
    });

    it("handles database errors gracefully", async () => {
      mockPrismaCount.mockImplementation(() =>
        Promise.reject(new Error("Database connection failed"))
      );

      const result = await runGoLiveGates(baseOptions);
      const gate1 = result.gates.find(
        (g) => g.gate === "centralized-inventory-routing"
      );

      expect(gate1?.passed).toBe(false);
      expect(gate1?.errors).toContainEqual(
        expect.stringContaining("Failed to query central inventory database")
      );
    });

    it("includes routed SKUs in details", async () => {
      const result = await runGoLiveGates(baseOptions);
      const gate1 = result.gates.find(
        (g) => g.gate === "centralized-inventory-routing"
      );

      expect(gate1?.details?.routedSkus).toEqual(["SKU-001", "SKU-002"]);
    });

    it("calculates total allocated quantity", async () => {
      const result = await runGoLiveGates(baseOptions);
      const gate1 = result.gates.find(
        (g) => g.gate === "centralized-inventory-routing"
      );

      expect(gate1?.details?.totalAllocatedQuantity).toBe(15); // 10 + 5
    });
  });

  describe("Gate 2: Inventory Reservation", () => {
    it("passes with default settings", async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes("shop.json")) return true;
        return false;
      });
      mockReadFileSync.mockImplementation(() =>
        JSON.stringify({ blockOutOfStock: true })
      );

      const result = await runGoLiveGates(baseOptions);
      const gate2 = result.gates.find((g) => g.gate === "inventory-reservation");

      expect(gate2?.passed).toBe(true);
      expect(gate2?.details?.holdTtlMinutes).toBe(20); // Updated default
    });

    it("fails when blockOutOfStock is disabled", async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes("shop.json")) return true;
        return false;
      });
      mockReadFileSync.mockImplementation(() =>
        JSON.stringify({ blockOutOfStock: false })
      );

      const result = await runGoLiveGates(baseOptions);
      const gate2 = result.gates.find((g) => g.gate === "inventory-reservation");

      expect(gate2?.passed).toBe(false);
      expect(gate2?.errors).toContainEqual(
        expect.stringContaining("Out-of-stock blocking is disabled")
      );
    });

    it("warns when hold TTL is below 15 minutes", async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes("shop.json")) return true;
        return false;
      });
      mockReadFileSync.mockImplementation(() =>
        JSON.stringify({
          inventoryHoldTtlMinutes: 10,
          blockOutOfStock: true,
        })
      );

      const result = await runGoLiveGates(baseOptions);
      const gate2 = result.gates.find((g) => g.gate === "inventory-reservation");

      expect(gate2?.passed).toBe(true); // Still passes, just warns
      expect(gate2?.warnings).toContainEqual(
        expect.stringContaining("Recommended minimum is 15 minutes")
      );
    });
  });

  describe("Gate aggregation", () => {
    it("allPassed is true when all gates pass", async () => {
      // Mock all file checks to pass
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes("shop.json")) return true;
        if (path.includes("pages/")) return true;
        if (path.includes("launch-gate.json")) return true;
        return false;
      });
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes("shop.json")) {
          return JSON.stringify({
            blockOutOfStock: true,
            logo: "/logo.png",
            favicon: "/favicon.ico",
            seo: { title: "Test", description: "Test shop" },
          });
        }
        if (path.includes("pages/")) {
          return JSON.stringify({ templateId: "test", status: "published" });
        }
        if (path.includes("launch-gate.json")) {
          return JSON.stringify({
            "test-shop": { qaAck: true, stageTestsStatus: "passed" },
          });
        }
        return "{}";
      });

      // In preview mode with E2E skipped, most gates should pass
      const result = await runGoLiveGates({
        ...baseOptions,
        mode: "preview",
        skipE2ETest: true,
      });

      // Check which gates failed for debugging
      const failedGates = result.gates.filter((g) => !g.passed);
      if (failedGates.length > 0) {
        console.log("Failed gates:", failedGates.map((g) => ({
          gate: g.gate,
          errors: g.errors,
        })));
      }

      expect(result.allPassed).toBe(true);
    });

    it("allPassed is false when any gate fails", async () => {
      mockPrismaCount.mockImplementation((model: string) => {
        if (model === "centralInventoryItem") return Promise.resolve(0);
        return Promise.resolve(0);
      });

      const result = await runGoLiveGates(baseOptions);
      expect(result.allPassed).toBe(false);
    });

    it("collects all errors and warnings", async () => {
      mockPrismaCount.mockImplementation((model: string) => {
        if (model === "centralInventoryItem") return Promise.resolve(0);
        return Promise.resolve(0);
      });
      mockExistsSync.mockImplementation(() => false);

      const result = await runGoLiveGates(baseOptions);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("formatGateResults", () => {
    it("formats passing results correctly", async () => {
      const result = await runGoLiveGates(baseOptions);
      const formatted = formatGateResults(result);

      expect(formatted).toContain("GO-LIVE GATES REPORT");
      expect(formatted).toContain("[PASS]");
    });

    it("formats failing results correctly", async () => {
      mockPrismaCount.mockImplementation(() => Promise.resolve(0));

      const result = await runGoLiveGates(baseOptions);
      const formatted = formatGateResults(result);

      expect(formatted).toContain("[FAIL]");
      expect(formatted).toContain("ERROR:");
    });
  });

  describe("Gate 6: E2E Checkout Test", () => {
    it("passes when E2E test is skipped", async () => {
      const result = await runGoLiveGates({
        ...baseOptions,
        skipE2ETest: true,
      });
      const gate6 = result.gates.find((g) => g.gate === "e2e-checkout-test");

      expect(gate6?.passed).toBe(true);
      expect(gate6?.details?.skipped).toBe(true);
      expect(gate6?.warnings).toContainEqual(
        expect.stringContaining("E2E checkout test skipped")
      );
    });

    it("fails when no cached test results exist and runE2ETests is false", async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes("e2e-checkout.json")) return false;
        if (path.includes("shop.json")) return true;
        return false;
      });

      const result = await runGoLiveGates({
        ...baseOptions,
        skipE2ETest: false,
        runE2ETests: false,
      });
      const gate6 = result.gates.find((g) => g.gate === "e2e-checkout-test");

      expect(gate6?.passed).toBe(false);
      expect(gate6?.errors).toContainEqual(
        expect.stringContaining("E2E checkout test results not found")
      );
    });

    it("passes when cached test results show passing tests", async () => {
      const testResults = {
        passed: true,
        timestamp: new Date().toISOString(),
        tests: [{ title: "checkout flow", passed: true }],
        totalTests: 1,
        passedCount: 1,
        failedCount: 0,
      };

      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes("e2e-checkout.json")) return true;
        if (path.includes("shop.json")) return true;
        return false;
      });

      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes("e2e-checkout.json")) {
          return JSON.stringify(testResults);
        }
        if (path.includes("shop.json")) {
          return JSON.stringify({ blockOutOfStock: true });
        }
        return "{}";
      });

      const result = await runGoLiveGates({
        ...baseOptions,
        skipE2ETest: false,
        runE2ETests: false,
      });
      const gate6 = result.gates.find((g) => g.gate === "e2e-checkout-test");

      expect(gate6?.passed).toBe(true);
      expect(gate6?.details?.passed).toBe(true);
      expect(gate6?.details?.testCount).toBe(1);
    });

    it("fails when cached test results show failing tests", async () => {
      const testResults = {
        passed: false,
        timestamp: new Date().toISOString(),
        tests: [{ title: "checkout flow", passed: false }],
        totalTests: 1,
        passedCount: 0,
        failedCount: 1,
        failures: ["checkout flow"],
      };

      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes("e2e-checkout.json")) return true;
        if (path.includes("shop.json")) return true;
        return false;
      });

      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes("e2e-checkout.json")) {
          return JSON.stringify(testResults);
        }
        if (path.includes("shop.json")) {
          return JSON.stringify({ blockOutOfStock: true });
        }
        return "{}";
      });

      const result = await runGoLiveGates({
        ...baseOptions,
        skipE2ETest: false,
        runE2ETests: false,
      });
      const gate6 = result.gates.find((g) => g.gate === "e2e-checkout-test");

      expect(gate6?.passed).toBe(false);
      expect(gate6?.errors).toContainEqual(
        expect.stringContaining("E2E checkout test failed")
      );
    });

    it("warns when cached test results are older than 24 hours", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 2 days ago

      const testResults = {
        passed: true,
        timestamp: oldDate.toISOString(),
        tests: [{ title: "checkout flow", passed: true }],
        totalTests: 1,
        passedCount: 1,
        failedCount: 0,
      };

      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes("e2e-checkout.json")) return true;
        if (path.includes("shop.json")) return true;
        return false;
      });

      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes("e2e-checkout.json")) {
          return JSON.stringify(testResults);
        }
        if (path.includes("shop.json")) {
          return JSON.stringify({ blockOutOfStock: true });
        }
        return "{}";
      });

      const result = await runGoLiveGates({
        ...baseOptions,
        skipE2ETest: false,
        runE2ETests: false,
      });
      const gate6 = result.gates.find((g) => g.gate === "e2e-checkout-test");

      expect(gate6?.passed).toBe(true); // Still passes but warns
      expect(gate6?.warnings).toContainEqual(
        expect.stringContaining("older than 24 hours")
      );
    });

    it("requires baseUrl when runE2ETests is true", async () => {
      const result = await runGoLiveGates({
        ...baseOptions,
        skipE2ETest: false,
        runE2ETests: true,
        e2eBaseUrl: undefined,
      });
      const gate6 = result.gates.find((g) => g.gate === "e2e-checkout-test");

      expect(gate6?.passed).toBe(false);
      expect(gate6?.errors).toContainEqual(
        expect.stringContaining("E2E base URL is required")
      );
    });
  });
});
