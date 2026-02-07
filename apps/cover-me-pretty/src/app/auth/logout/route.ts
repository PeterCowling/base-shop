import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildOidcLogoutUrl, destroyCustomerSession } from "@acme/auth";
import { authEnv } from "@acme/config/env/auth";

export const runtime = "nodejs";

const OIDC_FLOW_COOKIE = "oidc_flow";

export async function GET(req: NextRequest) {
  await destroyCustomerSession();
  if (authEnv.AUTH_PROVIDER === "oauth") {
    try {
      const logoutUrl = await buildOidcLogoutUrl();
      if (logoutUrl) {
        const response = NextResponse.redirect(logoutUrl);
        response.cookies.delete(OIDC_FLOW_COOKIE);
        return response;
      }
    } catch (error) {
      console.error("OIDC logout failed", error); // i18n-exempt -- ABC-123 [ttl=2025-06-30] internal auth error log
    }
  }

  const response = NextResponse.redirect(new URL("/", req.url));
  response.cookies.delete(OIDC_FLOW_COOKIE);
  return response;
}
