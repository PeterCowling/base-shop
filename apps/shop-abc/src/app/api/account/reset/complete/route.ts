// apps/shop-abc/src/app/api/account/reset/complete/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserById, updatePassword } from "@platform-core/users";
import { validateCsrfToken } from "@auth";

const schema = z.object({
  customerId: z.string(),
  token: z.string(),
  password: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { customerId, token, password } = parsed.data;
  const user = await getUserById(customerId);
  if (!user || user.resetToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updatePassword(customerId, passwordHash);
  return NextResponse.json({ ok: true });
}
