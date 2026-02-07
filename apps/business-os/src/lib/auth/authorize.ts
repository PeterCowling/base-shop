/**
 * Server-side path authorization for Business OS write operations
 *
 * Phase 0: Path-based allowlist (Pete-only, single-user)
 * Phase 1+: Will add user-specific permissions
 */

/**
 * Authorize a write operation to a file path
 *
 * @param filePath - Absolute path to file being written
 * @param repoRoot - Absolute path to repository root
 * @returns true if write is authorized, false otherwise
 *
 * Phase 0 allowlist:
 * - Writes allowed: docs/business-os/**
 * - Writes denied: all other paths
 */
export function authorizeWrite(filePath: string, repoRoot: string): boolean {
  // Normalize paths (remove trailing slashes, resolve relative paths)
  const normalizedFilePath = normalizePath(filePath);
  const normalizedRepoRoot = normalizePath(repoRoot);

  // File must be within repo
  if (!normalizedFilePath.startsWith(normalizedRepoRoot)) {
    return false;
  }

  // Get relative path from repo root
  const relativePath = normalizedFilePath
    .slice(normalizedRepoRoot.length)
    .replace(/^\//, "");

  // Phase 0 allowlist: Only docs/business-os/**
  if (relativePath.startsWith("docs/business-os/")) {
    return true;
  }

  // Deny all other paths
  return false;
}

/**
 * Authorize a read operation to a file path
 *
 * Phase 0: All Business OS docs are readable (single-user)
 * Phase 1+: Will add user-specific visibility rules
 */
export function authorizeRead(filePath: string, repoRoot: string): boolean {
  const normalizedFilePath = normalizePath(filePath);
  const normalizedRepoRoot = normalizePath(repoRoot);

  if (!normalizedFilePath.startsWith(normalizedRepoRoot)) {
    return false;
  }

  const relativePath = normalizedFilePath
    .slice(normalizedRepoRoot.length)
    .replace(/^\//, "");

  // Phase 0: All Business OS docs readable
  if (relativePath.startsWith("docs/business-os/")) {
    return true;
  }

  return false;
}

/**
 * Validate that a file path is within allowed Business OS locations
 *
 * @param relativePath - Path relative to docs/business-os/
 * @param locationType - Type of location (ideas, cards, strategy, etc.)
 */
export function validateBusinessOsPath(
  relativePath: string,
  locationType: "ideas" | "cards" | "strategy" | "people" | "scans"
): boolean {
  const normalized = relativePath.replace(/^\//, "").replace(/\/$/, "");

  switch (locationType) {
    case "ideas":
      // Allow: ideas/inbox/*, ideas/worked/*, ideas/*/archive/*
      return (
        normalized.startsWith("ideas/inbox/") ||
        normalized.startsWith("ideas/worked/") ||
        /^ideas\/(inbox|worked)\/archive\//.test(normalized)
      );

    case "cards":
      // Allow: cards/*.user.md, cards/*/*.user.md (stage docs), cards/archive/*
      return (
        /^cards\/[^/]+\.user\.md$/.test(normalized) ||
        /^cards\/[^/]+\/[^/]+\.user\.md$/.test(normalized) ||
        normalized.startsWith("cards/archive/")
      );

    case "strategy":
      // Allow: strategy/*.json, strategy/*/*.md
      return (
        /^strategy\/[^/]+\.json$/.test(normalized) ||
        /^strategy\/[^/]+\/[^/]+\.md$/.test(normalized)
      );

    case "people":
      // Allow: people/*.md
      return /^people\/[^/]+\.md$/.test(normalized);

    case "scans":
      // Allow: scans/*.json, scans/history/*
      return (
        /^scans\/[^/]+\.json$/.test(normalized) ||
        normalized.startsWith("scans/history/")
      );

    default:
      return false;
  }
}

/**
 * Normalize a file path for comparison
 */
function normalizePath(path: string): string {
  // Remove trailing slashes
  return path.replace(/\/+$/, "");
}
