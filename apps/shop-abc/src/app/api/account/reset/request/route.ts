// apps/shop-abc/src/app/api/account/reset/request/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getUserByEmail, setResetToken } from "@acme/platform-core/users";
import { sendEmail } from "@acme/email";
import { checkLoginRateLimit } from "../../../../../middleware";
import { validateCsrfToken } from "@auth";
import { parseJsonBody } from "@shared-utils";

export const ResetRequestSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();
export type ResetRequestInput = z.infer<typeof ResetRequestSchema>;

export async function POST(req: Request) {
  const parsed = await parseJsonBody<ResetRequestInput>(
    req,
    ResetRequestSchema,
  );
  if (!parsed.success) return parsed.response;

  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimited = await checkLoginRateLimit(ip, parsed.data.email);
  if (rateLimited) return rateLimited;

  const user = await getUserByEmail(parsed.data.email);
  if (user) {
    const token = crypto.randomUUID();
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    await setResetToken(user.id, hashedToken);
    const resetUrl = `/account/reset?token=${token}`;
    await sendEmail(
      parsed.data.email,
      "Password reset",
      `Reset your password: ${resetUrl}`,
    );
  }

  return NextResponse.json({ ok: true });
}
