// apps/cms/src/app/api/auth/[...nextauth]/route.ts
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@cms/auth/options";
import { RateLimiterMemory } from "rate-limiter-flexible";

export const runtime = "nodejs";

const limiter = new RateLimiterMemory({ points: 5, duration: 60 });

const handler = NextAuth(authOptions);

/**
 * Get client IP from request headers.
 * Prioritizes trusted CDN headers over spoofable ones.
 */
function getClientIp(req: NextRequest): string {
  // CF-Connecting-IP is set by Cloudflare and cannot be spoofed by clients
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // X-Real-IP is typically set by trusted reverse proxies
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  // X-Forwarded-For can be spoofed - only use as fallback
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return "unknown";
}

const rateLimited = async (
  req: NextRequest,
  ctx: { params: { nextauth: string[] } }
) => {
  const ip = getClientIp(req);

  try {
    await limiter.consume(ip);
    return handler(req, ctx);
  } catch {
    return new Response("Too Many Requests", { status: 429 });
  }
};

export { rateLimited as GET, rateLimited as POST };
