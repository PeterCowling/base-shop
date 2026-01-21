import { type NextRequest,NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { type ThemeLibraryEntry,themeLibrarySchema } from "@acme/theme";

import { writeJsonFile } from "@/lib/server/jsonIO";

const LIB_PATH = path.join(process.cwd(), "data", "themes", "library.json");

async function readLibrary(): Promise<ThemeLibraryEntry[]> {
  try {
    const buf = await fs.readFile(LIB_PATH, "utf8");
    return JSON.parse(buf) as ThemeLibraryEntry[];
  } catch {
    return [];
  }
}

async function writeLibrary(themes: ThemeLibraryEntry[]) {
  await writeJsonFile(LIB_PATH, themes);
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ themeId: string }> },
) {
  const { themeId } = await context.params;
  const themes = await readLibrary();
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(theme);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ themeId: string }> },
) {
  try {
    const { themeId } = await context.params;
    const body = await req.json();
    const themes = await readLibrary();
    const idx = themes.findIndex((t) => t.id === themeId);
    if (idx === -1)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const merged = { ...themes[idx], ...body, id: themeId };
    const parsed = themeLibrarySchema.parse(merged);
    themes[idx] = parsed;
    await writeLibrary(themes);
    return NextResponse.json(parsed);
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
  const themes = await readLibrary();
  const idx = themes.findIndex((t) => t.id === themeId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  themes.splice(idx, 1);
  await writeLibrary(themes);
  return new NextResponse(null, { status: 204 });
}
