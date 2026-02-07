/**
 * Tests for launch config validation.
 * @jest-environment node
 */

import { writeFileSync, unlinkSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { loadAndValidateConfig } from "../../src/launch-shop/preflight";

describe("loadAndValidateConfig", () => {
  const testDir = join(__dirname, "test-configs");
  const validConfig = {
    schemaVersion: 1,
    shopId: "test-shop",
    deployTarget: {
      type: "cloudflare-pages",
      projectName: "test-shop",
    },
  };

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("file loading", () => {
    it("throws on missing config file", () => {
      expect(() => loadAndValidateConfig("/nonexistent/path.json")).toThrow(
        "Config file not found"
      );
    });

    it("throws on invalid JSON", () => {
      const configPath = join(testDir, "invalid.json");
      writeFileSync(configPath, "{ invalid json }");

      expect(() => loadAndValidateConfig(configPath)).toThrow("Invalid JSON");

      unlinkSync(configPath);
    });

    it("loads valid JSON config", () => {
      const configPath = join(testDir, "valid.json");
      writeFileSync(configPath, JSON.stringify(validConfig));

      const result = loadAndValidateConfig(configPath);
      expect(result.shopId).toBe("test-shop");

      unlinkSync(configPath);
    });
  });

  describe("schema validation", () => {
    it("requires schemaVersion", () => {
      const configPath = join(testDir, "no-version.json");
      const config = { ...validConfig };
      delete (config as any).schemaVersion;
      writeFileSync(configPath, JSON.stringify(config));

      expect(() => loadAndValidateConfig(configPath)).toThrow(
        /schemaVersion/i
      );

      unlinkSync(configPath);
    });

    it("requires shopId", () => {
      const configPath = join(testDir, "no-shopid.json");
      const config = { ...validConfig };
      delete (config as any).shopId;
      writeFileSync(configPath, JSON.stringify(config));

      expect(() => loadAndValidateConfig(configPath)).toThrow(/shopId/i);

      unlinkSync(configPath);
    });

    it("requires deployTarget", () => {
      const configPath = join(testDir, "no-deploy.json");
      const config = { ...validConfig };
      delete (config as any).deployTarget;
      writeFileSync(configPath, JSON.stringify(config));

      expect(() => loadAndValidateConfig(configPath)).toThrow(/deployTarget/i);

      unlinkSync(configPath);
    });

    it("validates deployTarget.type enum", () => {
      const configPath = join(testDir, "bad-target.json");
      const config = {
        ...validConfig,
        deployTarget: { type: "invalid-target", projectName: "test" },
      };
      writeFileSync(configPath, JSON.stringify(config));

      expect(() => loadAndValidateConfig(configPath)).toThrow(/deployTarget/i);

      unlinkSync(configPath);
    });

    it("accepts valid cloudflare-pages target", () => {
      const configPath = join(testDir, "cf-target.json");
      const config = {
        ...validConfig,
        deployTarget: { type: "cloudflare-pages", projectName: "my-project" },
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadAndValidateConfig(configPath);
      expect(result.deployTarget.type).toBe("cloudflare-pages");

      unlinkSync(configPath);
    });

    it("accepts valid vercel target", () => {
      const configPath = join(testDir, "vercel-target.json");
      const config = {
        ...validConfig,
        deployTarget: { type: "vercel", projectName: "my-project" },
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadAndValidateConfig(configPath);
      expect(result.deployTarget.type).toBe("vercel");

      unlinkSync(configPath);
    });

    it("accepts local target without projectName", () => {
      const configPath = join(testDir, "local-target.json");
      const config = {
        ...validConfig,
        deployTarget: { type: "local" },
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadAndValidateConfig(configPath);
      expect(result.deployTarget.type).toBe("local");

      unlinkSync(configPath);
    });
  });

  describe("optional fields", () => {
    it("accepts name field", () => {
      const configPath = join(testDir, "with-name.json");
      const config = { ...validConfig, name: "My Test Shop" };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadAndValidateConfig(configPath);
      expect(result.name).toBe("My Test Shop");

      unlinkSync(configPath);
    });

    it("accepts theme field", () => {
      const configPath = join(testDir, "with-theme.json");
      const config = { ...validConfig, theme: "dark" };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadAndValidateConfig(configPath);
      expect(result.theme).toBe("dark");

      unlinkSync(configPath);
    });

    it("accepts payment providers array", () => {
      const configPath = join(testDir, "with-payment.json");
      const config = { ...validConfig, payment: ["stripe", "paypal"] };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadAndValidateConfig(configPath);
      expect(result.payment).toEqual(["stripe", "paypal"]);

      unlinkSync(configPath);
    });

    it("accepts smokeChecks array", () => {
      const configPath = join(testDir, "with-smoke.json");
      const config = {
        ...validConfig,
        smokeChecks: [
          { endpoint: "/", expectedStatus: 200 },
          { endpoint: "/api/health", expectedStatus: 200 },
        ],
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadAndValidateConfig(configPath);
      expect(result.smokeChecks).toHaveLength(2);
      expect(result.smokeChecks![0].endpoint).toBe("/");

      unlinkSync(configPath);
    });

    it("accepts ci configuration", () => {
      const configPath = join(testDir, "with-ci.json");
      const config = {
        ...validConfig,
        ci: {
          workflowName: "deploy-shop-test.yml",
          useReusableWorkflow: true,
        },
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadAndValidateConfig(configPath);
      expect(result.ci?.workflowName).toBe("deploy-shop-test.yml");
      expect(result.ci?.useReusableWorkflow).toBe(true);

      unlinkSync(configPath);
    });
  });
});
