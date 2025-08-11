// apps/shop-abc/src/app/api/mfa/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createCustomerSession,
  getCustomerSession,
  validateCsrfToken,
  verifyMfa,
} from "@auth";
import type { Role } from "@auth/types/roles";
import { getUserById } from "../../../userStore";
import {
  checkMfaRateLimit,
  clearLoginAttempts,
  clearMfaAttempts,
} from "../../../../middleware";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const headerToken = req.headers.get("x-csrf-token");
  const valid = await validateCsrfToken(headerToken);
  if (!valid)
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

  const { token, customerId } = await req.json();
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const session = await getCustomerSession();
  const id = session?.customerId ?? customerId;
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimited = await checkMfaRateLimit(ip, id);
  if (rateLimited) return rateLimited;

  const ok = await verifyMfa(id, token);

  if (ok) {
    await clearMfaAttempts(ip, id);
    if (!session) {
      const user = await getUserById(id);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      await createCustomerSession({ customerId: id, role: user.role as Role });
      await clearLoginAttempts(ip, id);
    }
  }

  return NextResponse.json({ verified: ok });
}
