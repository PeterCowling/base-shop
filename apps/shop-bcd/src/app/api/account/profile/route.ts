// apps/shop-bcd/src/app/api/account/profile/route.ts
import { getCustomerSession } from "@auth";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@acme/platform-core";
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

export async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
  }

  await updateCustomerProfile(session.customerId, parsed.data);
  const profile = await getCustomerProfile(session.customerId);
  return NextResponse.json({ ok: true, profile });
}

