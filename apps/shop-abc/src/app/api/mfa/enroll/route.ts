// apps/shop-abc/src/app/api/mfa/enroll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, enrollMfa } from "@auth";

export async function POST(_req: NextRequest): Promise<NextResponse> {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const enrollment = await enrollMfa(session.customerId);
  return NextResponse.json(enrollment);
}
