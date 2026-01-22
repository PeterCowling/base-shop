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

export async function GET() {
  const themes = await readLibrary();
  return NextResponse.json(themes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = themeLibrarySchema.parse({
      ...body,
      id: body.id ?? crypto.randomUUID(),
    });
    const themes = await readLibrary();
    themes.push(parsed);
    await writeLibrary(themes);
    return NextResponse.json(parsed, { status: 201 });
  } catch (err) {
    console.error("[api/themes] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create theme" },
      { status: 400 },
    );
  }
}
