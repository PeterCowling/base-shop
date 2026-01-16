// apps/cms/src/app/api/theme/list/route.ts
import { NextResponse } from "next/server";
import { listThemes } from "@acme/platform-core/createShop";

export async function GET() {
  try {
    const themes = listThemes();
    return NextResponse.json({ themes });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, themes: [] },
      { status: 200 },
    );
  }
}

