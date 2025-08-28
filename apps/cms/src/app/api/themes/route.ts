import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { themeLibraryEntrySchema } from "@acme/theme";

const store: Map<string, any> = (globalThis as any).__themeLibrary ??= new Map();

export async function GET() {
  return NextResponse.json({ themes: Array.from(store.values()) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = themeLibraryEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
  }
  const id = parsed.data.id ?? crypto.randomUUID();
  const theme = { id, ...parsed.data };
  store.set(id, theme);
  return NextResponse.json({ theme }, { status: 201 });
}
