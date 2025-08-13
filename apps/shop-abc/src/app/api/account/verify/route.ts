// apps/shop-abc/src/app/api/account/verify/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getUserById } from "@acme/platform-core/users";
import { validateCsrfToken } from "@auth";
import { parseJsonBody } from "@shared-utils";
import "@acme/lib/initZod";

export const VerifySchema = z.object({ token: z.string() }).strict();
export type VerifyInput = z.infer<typeof VerifySchema>;

export async function POST(req: Request) {
  const parsed = await parseJsonBody<VerifyInput>(req, VerifySchema);
  if (!parsed.success) return parsed.response;

  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { token } = parsed.data;
  const [id, sig] = token.split(".");
  if (!id || !sig)
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  const secret = process.env.SESSION_SECRET ?? "test-secret";
  const expected = crypto.createHmac("sha256", secret).update(id).digest("hex");
  if (sig !== expected)
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  const user = await getUserById(id);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
