// apps/shop-abc/src/app/api/account/reset/complete/route.ts
import "@acme/lib/initZod";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  getUserByResetToken,
  updatePassword,
  setResetToken,
} from "@acme/platform-core/users";
import { validateCsrfToken } from "@auth";
import { parseJsonBody } from "@shared-utils";

export const ResetCompleteSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must include uppercase, lowercase, and number",
      ),
  })
  .strict();
export type ResetCompleteInput = z.infer<typeof ResetCompleteSchema>;

export async function POST(req: Request) {
  const parsed = await parseJsonBody<ResetCompleteInput>(
    req,
    ResetCompleteSchema,
  );
  if (!parsed.success) return parsed.response;

  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { token, password } = parsed.data;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await getUserByResetToken(hashedToken);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updatePassword(user.id, passwordHash);
  await setResetToken(user.id, null, null);
  return NextResponse.json({ ok: true });
}
