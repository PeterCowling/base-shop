import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getCustomerSession, validateCsrfToken } from "@auth";
import { getUserById, updatePassword } from "@acme/platform-core/users";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must include uppercase, lowercase, and number",
      ),
  })
  .strict();

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export async function POST(req: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = req.headers.get("x-csrf-token");
  if (!token || !(await validateCsrfToken(token))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = ChangePasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;
  const user = await getUserById(session.customerId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await updatePassword(user.id, newHash);
  return NextResponse.json({ ok: true });
}
