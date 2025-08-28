import { NextRequest, NextResponse } from "next/server";
import { parseThemeLibraryEntry } from "@acme/theme";
import { themeLibrary } from "./store";

export async function GET() {
  return NextResponse.json(themeLibrary);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = parseThemeLibraryEntry(body);
    themeLibrary.push(entry);
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
