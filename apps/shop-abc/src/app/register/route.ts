// apps/shop-abc/src/app/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createUser,
  getUserById,
  getUserByEmail,
} from "@acme/platform-core/users";
import { checkRegistrationRateLimit } from "../../middleware";
import { validateCsrfToken } from "@auth";
import { updateCustomerProfile } from "@acme/platform-core/customerProfiles";

const RegisterSchema = z.object({
  customerId: z.string(),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Password must include uppercase, lowercase, and number",
    ),
});

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
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await createUser({ id: customerId, email, passwordHash });
  await updateCustomerProfile(customerId, { name: "", email });
  return NextResponse.json({ ok: true });
}
