import "@acme/zod-utils/initZod";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@shared-utils";
import { z } from "zod";
import { getUserByResetToken, updatePassword, setResetToken } from "@platform-core/users";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(8) }).strict();

export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  const parsed = await parseJsonBody(req, schema, "1mb");
  if ("response" in parsed) {
    return parsed.response;
  }
  try {
    const user = await getUserByResetToken(params.token);
    await updatePassword(user.id, parsed.data.password);
    await setResetToken(user.id, null, null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 },
    );
  }
}
