// apps/shop-abc/src/app/api/mfa/enroll/route.ts
import { NextResponse } from "next/server";
import { getCustomerSession, generateMfaSecret } from "@auth";

export const runtime = "edge";

export async function POST() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { secret, otpauth } = generateMfaSecret(session.customerId);
  return NextResponse.json({ ok: true, secret, otpauth });
}
