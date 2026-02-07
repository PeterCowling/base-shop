/**
 * Tests for repository root path resolution
 * Task: MVP-A1 (Production run mode + repoRoot config)
 */

import { getRepoRoot, isValidRepoRoot } from "./get-repo-root";

describe("getRepoRoot", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: () => string;

  beforeEach(() => {
    // Save original environment and cwd
    originalEnv = { ...process.env };
    originalCwd = process.cwd;
  });

  afterEach(() => {
    // Restore original environment and cwd
    process.env = originalEnv;
    process.cwd = originalCwd;
  });

  it("should use BUSINESS_OS_REPO_ROOT env var when set", () => {
    process.env.BUSINESS_OS_REPO_ROOT = "/production/repo";
    const result = getRepoRoot();
    expect(result).toBe("/production/repo");
  });

  it("should prefer env var over CWD even when CWD has business-os suffix", () => {
    process.env.BUSINESS_OS_REPO_ROOT = "/production/repo";
    process.cwd = () => "/Users/test/repo/apps/business-os";
    const result = getRepoRoot();
    expect(result).toBe("/production/repo");
  });

  it("should strip /apps/business-os suffix from CWD if present", () => {
    delete process.env.BUSINESS_OS_REPO_ROOT;
    const mockCwd = "/Users/test/repo/apps/business-os";
    process.cwd = () => mockCwd;
    const result = getRepoRoot();
    expect(result).toBe("/Users/test/repo");
  });

  it("should return CWD as-is when no suffix present", () => {
    delete process.env.BUSINESS_OS_REPO_ROOT;
    const mockCwd = "/Users/test/repo";
    process.cwd = () => mockCwd;
    const result = getRepoRoot();
    expect(result).toBe("/Users/test/repo");
  });

  it("should handle CWD at filesystem root", () => {
    delete process.env.BUSINESS_OS_REPO_ROOT;
    process.cwd = () => "/";
    const result = getRepoRoot();
    expect(result).toBe("/");
  });

  it("should handle deeply nested business-os path", () => {
    delete process.env.BUSINESS_OS_REPO_ROOT;
    process.cwd = () => "/very/deep/nested/path/apps/business-os";
    const result = getRepoRoot();
    expect(result).toBe("/very/deep/nested/path");
  });

  it("should not strip business-os from middle of path", () => {
    delete process.env.BUSINESS_OS_REPO_ROOT;
    process.cwd = () => "/apps/business-os/something/else";
    const result = getRepoRoot();
    expect(result).toBe("/apps/business-os/something/else");
  });
});

describe("isValidRepoRoot", () => {
  it("should accept valid absolute path", () => {
    expect(isValidRepoRoot("/Users/test/repo")).toBe(true);
    expect(isValidRepoRoot("/app")).toBe(true);
    expect(isValidRepoRoot("/production/base-shop")).toBe(true);
  });

  it("should reject filesystem root", () => {
    expect(isValidRepoRoot("/")).toBe(false);
  });

  it("should reject relative paths", () => {
    expect(isValidRepoRoot("./relative/path")).toBe(false);
    expect(isValidRepoRoot("../parent")).toBe(false);
    expect(isValidRepoRoot("relative")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isValidRepoRoot("")).toBe(false);
  });

  it("should reject paths without leading slash", () => {
    expect(isValidRepoRoot("apps/business-os")).toBe(false);
  });
});
