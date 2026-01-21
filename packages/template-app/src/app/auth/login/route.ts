import { type NextRequest,NextResponse } from "next/server";

import { beginOidcLogin } from "@acme/auth";
import { authEnv } from "@acme/config/env/auth";

export const runtime = "nodejs";

const OIDC_FLOW_COOKIE = "oidc_flow";
const FLOW_TTL_SECONDS = 60 * 10;
const isSecureEnv = process.env.NODE_ENV !== "development";

function sanitizeReturnTo(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

export async function GET(req: NextRequest) {
  if (authEnv.AUTH_PROVIDER !== "oauth") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const returnTo = sanitizeReturnTo(req.nextUrl.searchParams.get("returnTo"));
  const { authorizationUrl, flowId } = await beginOidcLogin({ returnTo });
  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(OIDC_FLOW_COOKIE, flowId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureEnv,
    path: "/",
    maxAge: FLOW_TTL_SECONDS,
  });
  return response;
}
