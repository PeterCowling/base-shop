// apps/cms/src/app/api/auth/[...nextauth]/route.ts
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@cms/auth/options";
import { RateLimiterMemory } from "rate-limiter-flexible";

export const runtime = "nodejs";

const limiter = new RateLimiterMemory({ points: 5, duration: 60 });

const handler = NextAuth(authOptions);

const rateLimited = async (
  req: NextRequest,
  ctx: { params: { nextauth: string[] } }
) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  try {
    await limiter.consume(ip);
    return handler(req, ctx);
  } catch {
    return new Response("Too Many Requests", { status: 429 });
  }
};

export { rateLimited as GET, rateLimited as POST };
