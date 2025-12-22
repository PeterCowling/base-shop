import { NextResponse } from "next/server";
import { getCustomerSession } from "@auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({
    authenticated: true,
    customerId: session.customerId,
    role: session.role,
  });
}
