import { NextResponse } from "next/server";
import { addOrUpdateKey } from "@acme/i18n/editTranslations";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

export async function POST(request: Request) {
  const t = await getServerTranslations("en");
  try {
    const body = (await request.json()) as { key?: string; enValue?: string };
    const key = String(body?.key ?? "").trim();
    const enValue = String(body?.enValue ?? "");
    if (!key)
      return NextResponse.json(
        { success: false, error: t("api.cms.i18n.promote.missingKey") },
        { status: 400 }
      );
    // Minimal safeguard: only allow [a-zA-Z0-9._] in keys
    if (!/^[a-zA-Z0-9_.]+$/.test(key)) {
      return NextResponse.json(
        { success: false, error: t("api.cms.i18n.promote.invalidKeyFormat") },
        { status: 400 }
      );
    }
    addOrUpdateKey(key, enValue);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: t("api.cms.i18n.promote.serverError") },
      { status: 500 }
    );
  }
}
