// apps/shop-abc/src/app/api/account/reset/complete/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserById, updatePassword } from "@platform-core/users";
import { parseJsonBody } from "@shared-utils/parseJsonBody";

export const schema = z
  .object({
    customerId: z.string(),
    token: z.string(),
    password: z.string().min(8),
  })
  .strict();

export type ResetCompleteRequest = z.infer<typeof schema>;

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, schema);
  if (!parsed.success) return parsed.response;

  const { customerId, token, password } = parsed.data;
  const user = await getUserById(customerId);
  if (!user || user.resetToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updatePassword(customerId, passwordHash);
  return NextResponse.json({ ok: true });
}
