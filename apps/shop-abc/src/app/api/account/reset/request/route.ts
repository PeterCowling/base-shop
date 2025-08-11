// apps/shop-abc/src/app/api/account/reset/request/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getUserByEmail, setResetToken } from "../../../../userStore";
import { sendEmail } from "@lib/email";
import { checkLoginRateLimit } from "../../../../../middleware";
import { validateCsrfToken } from "@auth";

const schema = z.object({
  email: z.string().email(),
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

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimited = await checkLoginRateLimit(ip, parsed.data.email);
  if (rateLimited) return rateLimited;

  const user = await getUserByEmail(parsed.data.email);
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await setResetToken(user.id, hashedToken);
    await sendEmail(
      parsed.data.email,
      "Password reset",
      `Your token is ${token}`
    );
  }

  return NextResponse.json({ ok: true });
}
