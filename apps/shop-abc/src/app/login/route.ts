// apps/shop-abc/src/app/login/route.ts
import { NextResponse } from "next/server";
import { createCustomerSession } from "@auth";
import { RoleSchema } from "@auth/types/roles";
import { z } from "zod";

const LoginSchema = z.object({
  customerId: z.string(),
  role: RoleSchema,
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  await createCustomerSession(parsed.data);

  return NextResponse.json({ ok: true });
}
