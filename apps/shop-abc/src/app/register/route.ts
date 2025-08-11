// apps/shop-abc/src/app/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { addUser, USER_STORE } from "../userStore";
import { checkRegistrationRateLimit } from "../../middleware";

const RegisterSchema = z.object({
  customerId: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = RegisterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimited = await checkRegistrationRateLimit(ip);
  if (rateLimited) return rateLimited;

  const { customerId, email, password } = parsed.data;
  if (USER_STORE[customerId]) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }
  if (Object.values(USER_STORE).some((u) => u.email === email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  addUser(customerId, email, password);
  return NextResponse.json({ ok: true });
}
