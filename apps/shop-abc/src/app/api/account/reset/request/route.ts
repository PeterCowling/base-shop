// apps/shop-abc/src/app/api/account/reset/request/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail, setResetToken } from "../../../../userStore";
import { sendEmail } from "@lib/email";
import { checkLoginRateLimit } from "../../../../../middleware";

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

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimited = await checkLoginRateLimit(ip, parsed.data.email);
  if (rateLimited) return rateLimited;

  const user = await getUserByEmail(parsed.data.email);
  if (user) {
    const token = Math.random().toString(36).slice(2);
    await setResetToken(user.id, token);
    await sendEmail(parsed.data.email, "Password reset", `Your token is ${token}`);
  }

  return NextResponse.json({ ok: true });
}
