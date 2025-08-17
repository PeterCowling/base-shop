import "@acme/lib/initZod";
import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import { requirePermission, validateCsrfToken } from "@auth";
import { getUserById, updatePassword } from "@platform-core/users";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must include uppercase, lowercase, and number"
      ),
  })
  .strict();

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export async function POST(req: Request) {
  let session;
  try {
    session = await requirePermission("change_password");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = req.headers.get("x-csrf-token");
  if (!token || !(await validateCsrfToken(token))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = ChangePasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { currentPassword, newPassword } = parsed.data;
  const user = await getUserById(session.customerId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await argon2.verify(user.passwordHash, currentPassword);
  if (!valid) {
    return NextResponse.json(
      { error: "Current password incorrect" },
      { status: 400 }
    );
  }

  const newHash = await argon2.hash(newPassword);
  await updatePassword(user.id, newHash);
  return NextResponse.json({ ok: true });
}
