import { NextResponse } from "next/server";

import { readLocalizedValues } from "@acme/i18n/editTranslations";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const key = String(url.searchParams.get("key") ?? "").trim();
    if (!key) return NextResponse.json({ success: false, error: "Missing key" }, { status: 400 });
    const values = readLocalizedValues(key);
    return NextResponse.json({ success: true, values });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
