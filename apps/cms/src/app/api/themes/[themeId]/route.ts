import { NextRequest, NextResponse } from "next/server";
import { themeLibraryEntrySchema, type ThemeLibraryEntry } from "@acme/theme";

const store: Map<string, ThemeLibraryEntry> =
  (globalThis as any).__themeLibraryStore ?? new Map();
(globalThis as any).__themeLibraryStore = store;

export async function GET(
  _req: NextRequest,
  { params }: { params: { themeId: string } },
) {
  const entry = store.get(params.themeId);
  if (!entry)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { themeId: string } },
) {
  const current = store.get(params.themeId);
  if (!current)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = themeLibraryEntrySchema.partial().safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  const updated = { ...current, ...parsed.data };
  store.set(params.themeId, updated);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { themeId: string } },
) {
  const existed = store.delete(params.themeId);
  if (!existed)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({});
}
