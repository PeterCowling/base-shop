// apps/telemetry-worker/src/cors.ts
// i18n-exempt file -- OPS-000 [ttl=2025-12-31]: machine-facing CORS headers

import type { Env } from "./index";

export function getCorsHeaders(request: Request, _env: Env): HeadersInit {
  const origin = request.headers.get("origin") || "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function checkOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Allow non-browser requests

  const allowedOrigins = env.TELEMETRY_ALLOWED_ORIGINS?.split(",") || [];

  // Allow any origin if not configured (dev mode)
  if (allowedOrigins.length === 0) return true;

  return allowedOrigins.some(
    (allowed) => origin === allowed.trim() || allowed.trim() === "*"
  );
}
