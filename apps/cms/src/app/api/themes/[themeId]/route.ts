import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { themeLibraryEntrySchema } from "@acme/theme";

const store: Map<string, any> = (globalThis as any).__themeLibrary ??= new Map();

export async function GET(
  _req: NextRequest,
  { params }: { params: { themeId: string } },
) {
  const theme = store.get(params.themeId);
  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ theme });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { themeId: string } },
) {
  const body = await req.json().catch(() => ({}));
  const parsed = themeLibraryEntrySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
  }
  const existing = store.get(params.themeId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = { ...existing, ...parsed.data };
  store.set(params.themeId, updated);
  return NextResponse.json({ theme: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { themeId: string } },
) {
  const existed = store.delete(params.themeId);
  if (!existed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
