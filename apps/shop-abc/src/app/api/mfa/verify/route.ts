// apps/shop-abc/src/app/api/mfa/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerSession,
  validateCsrfToken,
  verifyMfa,
  createCustomerSession,
} from "@auth";
import type { Role } from "@auth/types/roles";
import { getUserById } from "../../../userStore";
import { clearLoginAttempts } from "../../../../middleware";

const ALLOWED_ROLES: Role[] = ["customer", "viewer"];

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { token, customerId } = await req.json();
  const session = await getCustomerSession();
  if (!session && !customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headerToken = req.headers.get("x-csrf-token");
  const valid = await validateCsrfToken(headerToken);
  if (!valid)
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  if (session) {
    const ok = await verifyMfa(session.customerId, token);
    return NextResponse.json({ verified: ok });
  }

  if (!customerId)
    return NextResponse.json({ error: "Customer ID required" }, { status: 400 });

  const ok = await verifyMfa(customerId, token);
  if (!ok) return NextResponse.json({ verified: false });

  const user = await getUserById(customerId);
  if (!user)
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  const role = user.role as Role;
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
  }

  await createCustomerSession({ customerId, role });
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  await clearLoginAttempts(ip, customerId);

  return NextResponse.json({ verified: true });
}
