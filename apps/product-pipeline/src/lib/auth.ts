/* i18n-exempt file -- PP-1100 internal pipeline auth [ttl=2026-06-30] */
// apps/product-pipeline/src/lib/auth.ts

import type { PipelineEnv } from "@/routes/api/_lib/db";
import { errorResponse } from "@/routes/api/_lib/response";

/**
 * Alias for PipelineEnv with auth fields (now included in base type).
 */
export type AuthEnv = PipelineEnv;

/**
 * Extracts the API key from a request.
 * Supports:
 * - Authorization: Bearer <key>
 * - X-API-Key: <key>
 * - ?api_key=<key> query parameter
 */
function extractApiKey(request: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() || null;
  }

  // Check X-API-Key header
  const xApiKey = request.headers.get("X-API-Key");
  if (xApiKey) {
    return xApiKey.trim() || null;
  }

  // Check query parameter as fallback
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("api_key");
  if (queryKey) {
    return queryKey.trim() || null;
  }

  return null;
}

/**
 * Validates the API key from the request against the configured secret.
 * Returns an error response if authentication fails, null if successful.
 */
export function validateApiKey(
  request: Request,
  env: AuthEnv,
): Response | null {
  const configuredKey = env.PIPELINE_API_KEY;

  // If no API key is configured, deny all requests in production
  // but allow in development for easier local testing
  if (!configuredKey) {
    const isDev = env.PIPELINE_ENV === "dev";
    if (isDev) {
      // Allow unauthenticated requests in dev mode
      return null;
    }
    console.error(
      "[auth] PIPELINE_API_KEY not configured, denying request",
    );
    return errorResponse(500, "auth_not_configured");
  }

  const providedKey = extractApiKey(request);

  if (!providedKey) {
    return errorResponse(401, "missing_api_key", {
      hint: "Provide API key via Authorization: Bearer <key>, X-API-Key header, or api_key query parameter",
    });
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(providedKey, configuredKey)) {
    return errorResponse(401, "invalid_api_key");
  }

  return null; // Authentication successful
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still compare to prevent timing leaks on length
    let _result = 0;
    for (let i = 0; i < a.length; i++) {
      _result |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
