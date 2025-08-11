// apps/shop-abc/src/app/api/account/reset/complete/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserByResetToken, updatePassword } from "@platform-core/users";
import { parseJsonBody } from "@lib/parseJsonBody";

const schema = z
  .object({
    token: z.string(),
    password: z.string().min(8),
  })
  .strict();

export type ResetCompleteBody = z.infer<typeof schema>;

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, schema);
  if (!parsed.success) return parsed.error;

  const { token, password } = parsed.data;
  const user = await getUserByResetToken(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updatePassword(user.id, passwordHash);
  return NextResponse.json({ ok: true });
}
