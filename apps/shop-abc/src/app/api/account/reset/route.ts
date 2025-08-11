// apps/shop-abc/src/app/api/account/reset/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, USER_STORE } from "../../../userStore";
import { sendEmail } from "@lib/email";

const RequestSchema = z.object({
  email: z.string().email(),
});

const ResetSchema = z.object({
  token: z.string(),
  password: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const match = findUserByEmail(parsed.data.email);
  if (match) {
    const [, user] = match;
    const token = Math.random().toString(36).slice(2);
    user.resetToken = token;
    await sendEmail(
      parsed.data.email,
      "Password reset",
      `Your token is ${token}`,
    );
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const json = await req.json();
  const parsed = ResetSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const entry = Object.entries(USER_STORE).find(
    ([, u]) => u.resetToken === parsed.data.token,
  );
  if (!entry) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  const [, user] = entry;
  user.password = parsed.data.password;
  delete user.resetToken;

  return NextResponse.json({ ok: true });
}

