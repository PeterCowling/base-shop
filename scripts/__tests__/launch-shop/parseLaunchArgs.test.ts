/**
 * Tests for launch-shop CLI argument parsing.
 * @jest-environment node
 */

import { parseLaunchArgs } from "../../src/launch-shop/cli/parseLaunchArgs";

// Mock process.exit to prevent test termination
const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit called");
});

// Capture console.error output
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("parseLaunchArgs", () => {
  beforeEach(() => {
    mockExit.mockClear();
    mockConsoleError.mockClear();
  });

  describe("required arguments", () => {
    it("requires --config flag", () => {
      expect(() => parseLaunchArgs([])).toThrow("process.exit called");
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("--config")
      );
    });

    it("accepts --config with path", () => {
      const result = parseLaunchArgs(["--config", "path/to/config.json"]);
      expect(result.configPath).toBe("path/to/config.json");
    });
  });

  describe("mode selection", () => {
    it("defaults to preview mode", () => {
      const result = parseLaunchArgs(["--config", "config.json"]);
      expect(result.mode).toBe("preview");
    });

    it("accepts --mode preview", () => {
      const result = parseLaunchArgs([
        "--config",
        "config.json",
        "--mode",
        "preview",
      ]);
      expect(result.mode).toBe("preview");
    });

    it("accepts --mode production", () => {
      const result = parseLaunchArgs([
        "--config",
        "config.json",
        "--mode",
        "production",
      ]);
      expect(result.mode).toBe("production");
    });

    it("rejects invalid mode values", () => {
      expect(() =>
        parseLaunchArgs(["--config", "config.json", "--mode", "staging"])
      ).toThrow("process.exit called");
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("preview")
      );
    });
  });

  describe("validation modes", () => {
    it("parses --validate flag", () => {
      const result = parseLaunchArgs(["--config", "config.json", "--validate"]);
      expect(result.validate).toBe(true);
      expect(result.dryRun).toBe(false);
    });

    it("parses --dry-run flag", () => {
      const result = parseLaunchArgs(["--config", "config.json", "--dry-run"]);
      expect(result.dryRun).toBe(true);
      expect(result.validate).toBe(false);
    });

    it("rejects --validate and --dry-run together", () => {
      expect(() =>
        parseLaunchArgs([
          "--config",
          "config.json",
          "--validate",
          "--dry-run",
        ])
      ).toThrow("process.exit called");
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("mutually exclusive")
      );
    });
  });

  describe("secrets sourcing", () => {
    it("parses --env-file option", () => {
      const result = parseLaunchArgs([
        "--config",
        "config.json",
        "--env-file",
        "secrets.env",
      ]);
      expect(result.envFilePath).toBe("secrets.env");
    });

    it("parses --vault-cmd option", () => {
      const result = parseLaunchArgs([
        "--config",
        "config.json",
        "--vault-cmd",
        "vault kv get",
      ]);
      expect(result.vaultCmd).toBe("vault kv get");
    });
  });

  describe("override flags", () => {
    it("parses --force flag", () => {
      const result = parseLaunchArgs(["--config", "config.json", "--force"]);
      expect(result.force).toBe(true);
    });

    it("parses --allow-dirty-git flag", () => {
      const result = parseLaunchArgs([
        "--config",
        "config.json",
        "--allow-dirty-git",
      ]);
      expect(result.allowDirtyGit).toBe(true);
    });

    it("defaults override flags to false", () => {
      const result = parseLaunchArgs(["--config", "config.json"]);
      expect(result.force).toBe(false);
      expect(result.allowDirtyGit).toBe(false);
    });
  });

  describe("complete options", () => {
    it("parses all options together", () => {
      const result = parseLaunchArgs([
        "--config",
        "profiles/shops/acme.json",
        "--env-file",
        "profiles/shops/acme.env",
        "--mode",
        "production",
        "--force",
        "--allow-dirty-git",
      ]);

      expect(result).toEqual({
        configPath: "profiles/shops/acme.json",
        envFilePath: "profiles/shops/acme.env",
        vaultCmd: undefined,
        mode: "production",
        validate: false,
        dryRun: false,
        force: true,
        allowDirtyGit: true,
        resume: false,
        fresh: false,
      });
    });
  });
});
