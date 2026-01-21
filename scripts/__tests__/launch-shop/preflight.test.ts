/**
 * Tests for launch-shop preflight validation.
 * @jest-environment node
 */

import { join } from "node:path";

// Mock modules before importing
const mockExecSync = jest.fn();
const mockEnsureRuntime = jest.fn();
const mockExistsSync = jest.fn();

jest.mock("node:child_process", () => {
  const actual = jest.requireActual("node:child_process");
  return {
    ...actual,
    execSync: (...args: unknown[]) => mockExecSync(...args),
  };
});

jest.mock("../../src/runtime", () => ({
  ensureRuntime: () => mockEnsureRuntime(),
}));

jest.mock("node:fs", () => {
  const actual = jest.requireActual("node:fs");
  return {
    ...actual,
    existsSync: (path: string) => mockExistsSync(path),
  };
});

// Import after mocks are set up
import { runPreflight, type PreflightOptions } from "../../src/launch-shop/preflight";
import type { LaunchConfig } from "@acme/platform-core/createShop";
import * as fs from "node:fs";

describe("runPreflight", () => {
  const baseConfig: LaunchConfig = {
    schemaVersion: 1,
    shopId: "test-shop",
    deployTarget: {
      type: "cloudflare-pages",
      projectName: "test-shop",
    },
  };

  const baseOptions: PreflightOptions = {
    config: baseConfig,
    mode: "preview",
    allowDirtyGit: false,
    force: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: runtime passes
    mockEnsureRuntime.mockImplementation(() => {});

    // Default: paths don't exist (except env files when specified)
    mockExistsSync.mockImplementation((path: string) => {
      if (typeof path === "string" && path.includes("apps/shop-")) {
        return false;
      }
      // For env files, return true if the test set it up
      return actualFs.existsSync(path);
    });

    // Default mocks for passing preflight
    mockExecSync.mockImplementation((cmd: string, options?: any) => {
      const encoding = options?.encoding;

      if (cmd.includes("which git") || cmd.includes("which gh")) {
        return encoding === "utf8" ? "/usr/bin/tool" : Buffer.from("/usr/bin/tool");
      }
      if (cmd === "gh auth status") {
        return encoding === "utf8" ? "Logged in" : Buffer.from("Logged in");
      }
      if (cmd === "git status --porcelain") {
        return encoding === "utf8" ? "" : Buffer.from("");
      }
      if (cmd.includes("gh secret list")) {
        const output = "CLOUDFLARE_API_TOKEN\nCLOUDFLARE_ACCOUNT_ID\nTURBO_TOKEN";
        return encoding === "utf8" ? output : Buffer.from(output);
      }
      return encoding === "utf8" ? "" : Buffer.from("");
    });
  });

  describe("runtime check", () => {
    it("passes when runtime is valid", () => {
      const result = runPreflight(baseOptions);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("fails when runtime check throws", () => {
      mockEnsureRuntime.mockImplementation(() => {
        throw new Error("Node version too old");
      });

      const result = runPreflight(baseOptions);
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("Runtime check failed")
      );
    });
  });

  describe("CLI tools check", () => {
    it("fails when git is not found", () => {
      mockExecSync.mockImplementation((cmd: string, options?: any) => {
        if (cmd.includes("which git")) {
          throw new Error("not found");
        }
        const encoding = options?.encoding;
        if (cmd.includes("which gh")) {
          return encoding === "utf8" ? "/usr/bin/gh" : Buffer.from("/usr/bin/gh");
        }
        if (cmd === "gh auth status") {
          return encoding === "utf8" ? "Logged in" : Buffer.from("Logged in");
        }
        if (cmd === "git status --porcelain") {
          return encoding === "utf8" ? "" : Buffer.from("");
        }
        if (cmd.includes("gh secret list")) {
          const output = "CLOUDFLARE_API_TOKEN\nCLOUDFLARE_ACCOUNT_ID\nTURBO_TOKEN";
          return encoding === "utf8" ? output : Buffer.from(output);
        }
        return encoding === "utf8" ? "" : Buffer.from("");
      });

      const result = runPreflight(baseOptions);
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("git")
      );
    });

    it("fails when gh is not found", () => {
      mockExecSync.mockImplementation((cmd: string, options?: any) => {
        if (cmd.includes("which gh")) {
          throw new Error("not found");
        }
        const encoding = options?.encoding;
        if (cmd.includes("which git")) {
          return encoding === "utf8" ? "/usr/bin/git" : Buffer.from("/usr/bin/git");
        }
        return encoding === "utf8" ? "" : Buffer.from("");
      });

      const result = runPreflight(baseOptions);
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("gh")
      );
    });
  });

  describe("GitHub auth check", () => {
    it("fails when gh is not authenticated", () => {
      mockExecSync.mockImplementation((cmd: string, options?: any) => {
        if (cmd === "gh auth status") {
          throw new Error("not logged in");
        }
        const encoding = options?.encoding;
        if (cmd.includes("which")) {
          return encoding === "utf8" ? "/usr/bin/tool" : Buffer.from("/usr/bin/tool");
        }
        if (cmd === "git status --porcelain") {
          return encoding === "utf8" ? "" : Buffer.from("");
        }
        if (cmd.includes("gh secret list")) {
          const output = "CLOUDFLARE_API_TOKEN\nCLOUDFLARE_ACCOUNT_ID\nTURBO_TOKEN";
          return encoding === "utf8" ? output : Buffer.from(output);
        }
        return encoding === "utf8" ? "" : Buffer.from("");
      });

      const result = runPreflight(baseOptions);
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("GitHub CLI not authenticated")
      );
    });
  });

  describe("git working tree check", () => {
    it("fails on dirty git state by default", () => {
      mockExecSync.mockImplementation((cmd: string, options?: any) => {
        const encoding = options?.encoding;
        if (cmd === "git status --porcelain") {
          const output = "M modified-file.ts";
          return encoding === "utf8" ? output : Buffer.from(output);
        }
        if (cmd.includes("which")) {
          return encoding === "utf8" ? "/usr/bin/tool" : Buffer.from("/usr/bin/tool");
        }
        if (cmd === "gh auth status") {
          return encoding === "utf8" ? "Logged in" : Buffer.from("Logged in");
        }
        if (cmd.includes("gh secret list")) {
          const output = "CLOUDFLARE_API_TOKEN\nCLOUDFLARE_ACCOUNT_ID\nTURBO_TOKEN";
          return encoding === "utf8" ? output : Buffer.from(output);
        }
        return encoding === "utf8" ? "" : Buffer.from("");
      });

      const result = runPreflight(baseOptions);
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("dirty")
      );
    });

    it("passes with dirty git when --allow-dirty-git is set", () => {
      mockExecSync.mockImplementation((cmd: string, options?: any) => {
        const encoding = options?.encoding;
        if (cmd === "git status --porcelain") {
          const output = "M modified-file.ts";
          return encoding === "utf8" ? output : Buffer.from(output);
        }
        if (cmd.includes("which")) {
          return encoding === "utf8" ? "/usr/bin/tool" : Buffer.from("/usr/bin/tool");
        }
        if (cmd === "gh auth status") {
          return encoding === "utf8" ? "Logged in" : Buffer.from("Logged in");
        }
        if (cmd.includes("gh secret list")) {
          const output = "CLOUDFLARE_API_TOKEN\nCLOUDFLARE_ACCOUNT_ID\nTURBO_TOKEN";
          return encoding === "utf8" ? output : Buffer.from(output);
        }
        return encoding === "utf8" ? "" : Buffer.from("");
      });

      const result = runPreflight({ ...baseOptions, allowDirtyGit: true });
      expect(result.ok).toBe(true);
    });
  });

  describe("shop collision check", () => {
    it("fails when shop directory exists", () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (typeof path === "string" && path.includes("apps/shop-test-shop")) {
          return true;
        }
        return false;
      });

      const result = runPreflight(baseOptions);
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("already exists")
      );
    });

    it("passes with existing shop when --force is set", () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (typeof path === "string" && path.includes("apps/shop-test-shop")) {
          return true;
        }
        return false;
      });

      const result = runPreflight({ ...baseOptions, force: true });
      expect(result.ok).toBe(true);
    });
  });

  describe("TODO_ placeholder detection", () => {
    const testDir = join(__dirname, "test-env-files");
    const actualFs = jest.requireActual("node:fs") as typeof fs;

    beforeAll(() => {
      actualFs.mkdirSync(testDir, { recursive: true });
    });

    afterAll(() => {
      actualFs.rmSync(testDir, { recursive: true, force: true });
    });

    it("warns about TODO_ placeholders in preview mode", () => {
      const envPath = join(testDir, "preview.env");
      actualFs.writeFileSync(
        envPath,
        "STRIPE_SECRET_KEY=TODO_replace_me\nOTHER_KEY=valid_value"
      );

      // Make sure existsSync returns true for the env file
      mockExistsSync.mockImplementation((path: string) => {
        if (path === envPath) return true;
        if (typeof path === "string" && path.includes("apps/shop-")) return false;
        return actualFs.existsSync(path);
      });

      const result = runPreflight({
        ...baseOptions,
        envFilePath: envPath,
        mode: "preview",
      });

      expect(result.ok).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.stringContaining("TODO_")
      );

      actualFs.unlinkSync(envPath);
    });

    it("fails on TODO_ placeholders in production mode", () => {
      const envPath = join(testDir, "production.env");
      actualFs.writeFileSync(
        envPath,
        "STRIPE_SECRET_KEY=TODO_replace_me\nOTHER_KEY=valid_value"
      );

      mockExistsSync.mockImplementation((path: string) => {
        if (path === envPath) return true;
        if (typeof path === "string" && path.includes("apps/shop-")) return false;
        return actualFs.existsSync(path);
      });

      const result = runPreflight({
        ...baseOptions,
        envFilePath: envPath,
        mode: "production",
      });

      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("TODO_")
      );

      actualFs.unlinkSync(envPath);
    });
  });

  describe("GitHub secrets verification", () => {
    it("fails when required secrets are missing", () => {
      mockExecSync.mockImplementation((cmd: string, options?: any) => {
        const encoding = options?.encoding;
        if (cmd.includes("gh secret list")) {
          // Missing CLOUDFLARE_ACCOUNT_ID
          const output = "CLOUDFLARE_API_TOKEN\nTURBO_TOKEN";
          return encoding === "utf8" ? output : Buffer.from(output);
        }
        if (cmd.includes("which")) {
          return encoding === "utf8" ? "/usr/bin/tool" : Buffer.from("/usr/bin/tool");
        }
        if (cmd === "gh auth status") {
          return encoding === "utf8" ? "Logged in" : Buffer.from("Logged in");
        }
        if (cmd === "git status --porcelain") {
          return encoding === "utf8" ? "" : Buffer.from("");
        }
        return encoding === "utf8" ? "" : Buffer.from("");
      });

      const result = runPreflight(baseOptions);
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("CLOUDFLARE_ACCOUNT_ID")
      );
    });

    it("passes when all required secrets exist", () => {
      // Uses default mock which includes all secrets
      const result = runPreflight(baseOptions);
      expect(result.ok).toBe(true);
    });

    it("skips secrets check for local deploy target", () => {
      const localConfig: LaunchConfig = {
        ...baseConfig,
        deployTarget: { type: "local" },
      };

      mockExecSync.mockImplementation((cmd: string, options?: any) => {
        const encoding = options?.encoding;
        if (cmd.includes("gh secret list")) {
          // Would fail for cloudflare, but we're using local
          return encoding === "utf8" ? "" : Buffer.from("");
        }
        if (cmd.includes("which")) {
          return encoding === "utf8" ? "/usr/bin/tool" : Buffer.from("/usr/bin/tool");
        }
        if (cmd === "gh auth status") {
          return encoding === "utf8" ? "Logged in" : Buffer.from("Logged in");
        }
        if (cmd === "git status --porcelain") {
          return encoding === "utf8" ? "" : Buffer.from("");
        }
        return encoding === "utf8" ? "" : Buffer.from("");
      });

      const result = runPreflight({ ...baseOptions, config: localConfig });
      expect(result.ok).toBe(true);
    });
  });

  describe("project name validation", () => {
    it("fails on project name too long", () => {
      const longNameConfig: LaunchConfig = {
        ...baseConfig,
        deployTarget: {
          type: "cloudflare-pages",
          projectName: "a".repeat(64), // Max is 63
        },
      };

      const result = runPreflight({ ...baseOptions, config: longNameConfig });
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("too long")
      );
    });

    it("fails on invalid characters in project name", () => {
      const invalidNameConfig: LaunchConfig = {
        ...baseConfig,
        deployTarget: {
          type: "cloudflare-pages",
          projectName: "My_Project",
        },
      };

      const result = runPreflight({ ...baseOptions, config: invalidNameConfig });
      expect(result.ok).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("Invalid Cloudflare project name")
      );
    });

    it("passes with valid project name", () => {
      const validNameConfig: LaunchConfig = {
        ...baseConfig,
        deployTarget: {
          type: "cloudflare-pages",
          projectName: "my-valid-project-123",
        },
      };

      const result = runPreflight({ ...baseOptions, config: validNameConfig });
      expect(result.errors).not.toContainEqual(
        expect.stringContaining("project name")
      );
    });
  });
});
