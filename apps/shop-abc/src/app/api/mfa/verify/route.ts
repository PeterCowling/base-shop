// apps/shop-abc/src/app/api/mfa/verify/route.ts
import { NextResponse } from "next/server";
import { getCustomerSession, verifyMfaToken } from "@auth";
import { z } from "zod";

export const runtime = "edge";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
  }

  const ok = verifyMfaToken(session.customerId, parsed.data.token);
  if (!ok) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
