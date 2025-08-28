import { NextRequest, NextResponse } from "next/server";
import { parseThemeLibraryEntry } from "@acme/theme";
import { themeLibrary } from "../store";

function findIndex(id: string) {
  return themeLibrary.findIndex((t) => t.id === id);
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ themeId: string }> },
) {
  const { themeId } = await context.params;
  const idx = findIndex(themeId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(themeLibrary[idx]);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ themeId: string }> },
) {
  try {
    const { themeId } = await context.params;
    const idx = findIndex(themeId);
    if (idx === -1)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await req.json();
    const updated = { ...themeLibrary[idx], ...body };
    const entry = parseThemeLibraryEntry(updated);
    themeLibrary[idx] = entry;
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ themeId: string }> },
) {
  const { themeId } = await context.params;
  const idx = findIndex(themeId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  themeLibrary.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
