// apps/shop-abc/src/app/api/account/profile/route.ts
import { getCustomerSession } from "@auth";
import { getCustomerProfile } from "@/lib/customerProfile";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const schema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
  })
  .strict();

async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getCustomerProfile(session.customerId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
  }

  // TODO: persist profile changes
  return NextResponse.json({ ok: true, profile: parsed.data });
}

export { GET, PUT };

