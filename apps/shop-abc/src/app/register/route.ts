// apps/shop-abc/src/app/register/route.ts
import "@acme/lib/initZod";
import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import crypto from "crypto";
import {
  createUser,
  getUserById,
  getUserByEmail,
} from "@acme/platform-core/users";
import { checkRegistrationRateLimit } from "../../middleware";
import { validateCsrfToken } from "@auth";
import { updateCustomerProfile } from "@acme/platform-core/customerProfiles";
import { sendEmail } from "@acme/email";
import { env } from "@acme/config";

const RegisterSchema = z
  .object({
    customerId: z.string(),
    email: z.string().email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must include uppercase, lowercase, and number"
      ),
  })
  .strict();

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = RegisterSchema.safeParse(json);
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
  const rateLimited = await checkRegistrationRateLimit(ip);
  if (rateLimited) return rateLimited;

  const { customerId, email, password } = parsed.data;
  if (await getUserById(customerId)) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 400 }
    );
  }

  const passwordHash = await argon2.hash(password);
  await createUser({ id: customerId, email, passwordHash });
  await updateCustomerProfile(customerId, { name: "", email });

  const secret = env.SESSION_SECRET;
  if (typeof secret !== "string") {
    throw new Error("SESSION_SECRET is not set");
  }
  const signature = crypto
    .createHmac("sha256", secret)
    .update(customerId)
    .digest("hex");
  const token = `${customerId}.${signature}`;
  await sendEmail(
    email,
    "Verify your account",
    `Your verification token is ${token}`
  );

  return NextResponse.json({ ok: true });
}
