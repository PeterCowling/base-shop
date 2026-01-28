import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authorizeWrite } from "./authorize";

/**
 * Middleware helper to check write authorization
 *
 * Usage in API routes:
 *
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const filePath = "/path/to/file";
 *   const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");
 *
 *   const authResult = checkWriteAuthorization(filePath, repoRoot);
 *   if (authResult) {
 *     return authResult; // Returns 403 error response
 *   }
 *
 *   // Proceed with write operation
 * }
 * ```
 */
export function checkWriteAuthorization(
  filePath: string,
  repoRoot: string
): NextResponse | null {
  const isAuthorized = authorizeWrite(filePath, repoRoot);

  if (!isAuthorized) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: `Write access denied to path: ${filePath}`,
        hint: "Only paths under docs/business-os/ are writable in Phase 0",
      },
      { status: 403 }
    );
  }

  return null; // Authorization passed
}

/**
 * Extract and validate file path from request body
 *
 * Ensures the path doesn't contain directory traversal attempts
 */
export function sanitizeFilePath(path: string): string | null {
  // Check for directory traversal attempts
  if (path.includes("..") || path.includes("~")) {
    return null;
  }

  // Normalize path separators
  const normalized = path.replace(/\\/g, "/");

  // Remove any leading slashes (paths should be relative)
  return normalized.replace(/^\/+/, "");
}

/**
 * Validate request origin for write operations
 *
 * Phase 0: Always returns true (local-only)
 * Phase 1+: Will add CSRF protection
 */
export function validateRequestOrigin(_request: NextRequest): boolean {
  // Phase 0: Skip origin validation (local-only)
  // Phase 1+: Check origin header, CSRF token, etc.
  return true;
}
