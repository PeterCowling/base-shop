import "@acme/zod-utils/initZod";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@shared-utils";
import { z } from "zod";
import argon2 from "argon2";
import { getUserByResetToken, updatePassword, setResetToken } from "@platform-core/users";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(8) }).strict();

export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  const t = await getServerTranslations("en");
  const parsed = await parseJsonBody(req, schema, "1mb");
  if ("response" in parsed) {
    return parsed.response;
  }
  try {
    const user = await getUserByResetToken(params.token);
    const passwordHash = await argon2.hash(parsed.data.password);
    await updatePassword(user.id, passwordHash);
    await setResetToken(user.id, null, null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: t("api.passwordReset.invalidToken") },
      { status: 400 },
    );
  }
}
