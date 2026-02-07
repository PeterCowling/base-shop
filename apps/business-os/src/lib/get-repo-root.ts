/**
 * Repository Root Path Resolution
 *
 * Provides centralized logic for determining the monorepo root path.
 * Supports both development (auto-inference from CWD) and production
 * (explicit env var configuration).
 *
 * Phase: Multi-User MVP (BOS-P2)
 * Task: MVP-A1
 */

/**
 * Get the absolute path to the monorepo root.
 *
 * Resolution order:
 * 1. BUSINESS_OS_REPO_ROOT env var (production deployments)
 * 2. process.cwd() with /apps/business-os suffix stripped (development)
 * 3. process.cwd() as-is (fallback)
 *
 * @returns Absolute path to monorepo root
 *
 * @example
 * // Production (Cloudflare Pages, Vercel, etc.)
 * process.env.BUSINESS_OS_REPO_ROOT = "/app";
 * getRepoRoot(); // => "/app"
 *
 * @example
 * // Development (Next.js dev server)
 * process.cwd(); // => "/Users/pete/base-shop/apps/business-os"
 * getRepoRoot(); // => "/Users/pete/base-shop"
 */
export function getRepoRoot(): string {
  // Priority 1: Explicit production configuration
  if (process.env.BUSINESS_OS_REPO_ROOT) {
    return process.env.BUSINESS_OS_REPO_ROOT;
  }

  // Priority 2: Development auto-inference
  const cwd = process.cwd();
  if (cwd.endsWith("/apps/business-os")) {
    return cwd.replace(/\/apps\/business-os$/, "");
  }

  // Priority 3: Fallback (CWD is already repo root)
  return cwd;
}

/**
 * Validate that a repo root path is acceptable.
 *
 * Checks:
 * - Must be an absolute path (starts with "/")
 * - Cannot be the filesystem root ("/")
 *
 * @param repoRoot Path to validate
 * @returns true if valid, false otherwise
 */
export function isValidRepoRoot(repoRoot: string): boolean {
  // Must be absolute
  if (!repoRoot.startsWith("/")) {
    return false;
  }

  // Cannot be filesystem root
  if (repoRoot === "/") {
    return false;
  }

  return true;
}
