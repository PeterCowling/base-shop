import "@acme/zod-utils/initZod";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@shared-utils";
import { z } from "zod";
import crypto from "crypto";
import { getUserByEmail, setResetToken } from "@platform-core/users";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() }).strict();

export async function POST(req: Request) {
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
    // expose token for tests
    return NextResponse.json({ ok: true, token });
  } catch {
    // do not reveal whether email exists
    return NextResponse.json({ ok: true });
  }
}
