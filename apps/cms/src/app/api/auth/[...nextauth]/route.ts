// apps/cms/src/app/api/auth/[...nextauth]/route.ts
import { authOptions } from "@cms/auth/options";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

const limiter = new RateLimiterMemory({ points: 10, duration: 60 });

const handler = NextAuth(authOptions);

async function rateLimitedHandler(req: Request, context: unknown) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  try {
    await limiter.consume(ip);
  } catch {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }
  return handler(req, context as any);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
