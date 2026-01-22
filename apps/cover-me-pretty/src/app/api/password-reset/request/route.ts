import "@acme/zod-utils/initZod";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@acme/lib/http/server";
import { z } from "zod";
import crypto from "crypto";
import { getUserByEmail, setResetToken } from "@acme/platform-core/users";
import { sendEmail } from "@acme/email";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { createRateLimiter } from "@acme/auth/rateLimiter";

export const runtime = "nodejs";

// Strict rate limit: 3 requests per 15 minutes per IP to prevent enumeration
const limiter = createRateLimiter({ points: 3, duration: 900 });

const schema = z.object({ email: z.string().email() }).strict();

export async function POST(req: Request) {
  // Rate limit by IP before any processing
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    await limiter.consume(`pw-reset:${ip}`);
  } catch {
    return NextResponse.json({ ok: true }); // Silent fail to prevent enumeration
  }

  const t = await getServerTranslations("en");
  const parsed = await parseJsonBody(req, schema, "1mb");
  if ("response" in parsed) {
    return parsed.response;
  }
  try {
    const user = await getUserByEmail(parsed.data.email);
    const token = crypto.randomBytes(16).toString("hex");
    const expires =
      process.env.NODE_ENV === "test"
        ? new Date(Date.now() + 1000)
        : new Date(Date.now() + 3600_000);
    await setResetToken(user.id, token, expires);
    await sendEmail(
      user.email,
      t("email.passwordReset.subject"),
      `${t("email.passwordReset.codePrefix")}${token}`
    );
    return NextResponse.json({ ok: true });
  } catch {
    // do not reveal whether email exists
    return NextResponse.json({ ok: true });
  }
}
