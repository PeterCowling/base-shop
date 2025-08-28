import { NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";
import { themeLibraryEntrySchema, type ThemeLibraryEntry } from "@acme/theme";

const store: Map<string, ThemeLibraryEntry> =
  (globalThis as any).__themeLibraryStore ?? new Map();
(globalThis as any).__themeLibraryStore = store;

export async function GET() {
  return NextResponse.json(Array.from(store.values()));
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = themeLibraryEntrySchema.omit({ id: true }).safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  }
  const id = ulid();
  const entry: ThemeLibraryEntry = { id, ...parsed.data };
  store.set(id, entry);
  return NextResponse.json(entry, { status: 201 });
}
