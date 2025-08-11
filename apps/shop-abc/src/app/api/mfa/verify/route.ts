// apps/shop-abc/src/app/api/mfa/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, validateCsrfToken, verifyMfa } from "@auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const headerToken = req.headers.get("x-csrf-token");
  const valid = await validateCsrfToken(headerToken);
  if (!valid)
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });
  const ok = await verifyMfa(session.customerId, token);
  return NextResponse.json({ verified: ok });
}
