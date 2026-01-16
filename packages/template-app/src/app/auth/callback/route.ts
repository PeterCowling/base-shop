import { NextResponse, type NextRequest } from "next/server";
import { completeOidcLogin, createCustomerSession } from "@acme/auth";
import { getOrCreateCustomerIdentity } from "@acme/platform-core/identity";
import { authEnv } from "@acme/config/env/auth";

export const runtime = "nodejs";

const OIDC_FLOW_COOKIE = "oidc_flow";

function safeReturnTo(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

export async function GET(req: NextRequest) {
  if (authEnv.AUTH_PROVIDER !== "oauth") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const state = req.nextUrl.searchParams.get("state");
  const code = req.nextUrl.searchParams.get("code");
  const flowId = req.cookies.get(OIDC_FLOW_COOKIE)?.value;

  if (!state || !code || !flowId) {
    return NextResponse.redirect(new URL("/?error=missing_state", req.url));
  }

  try {
    const { profile, returnTo } = await completeOidcLogin({
      state,
      code,
      flowId,
    });

    const { internalCustomerId } = await getOrCreateCustomerIdentity({
      issuer: profile.issuer,
      subject: profile.subject,
      email: profile.email,
      name: profile.name,
    });

    await createCustomerSession({
      customerId: internalCustomerId,
      role: "customer",
    });

    const redirectTarget = new URL(safeReturnTo(returnTo), req.url);
    const response = NextResponse.redirect(redirectTarget);
    response.cookies.delete(OIDC_FLOW_COOKIE);
    return response;
  } catch (error) {
    console.error("OIDC callback failed", error); // i18n-exempt -- ABC-123 [ttl=2025-12-31] internal auth error log
    const response = NextResponse.redirect(new URL("/?error=auth_failed", req.url));
    response.cookies.delete(OIDC_FLOW_COOKIE);
    return response;
  }
}
