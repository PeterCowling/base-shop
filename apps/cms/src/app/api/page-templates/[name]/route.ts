import { NextResponse } from "next/server";
import fsSync, { promises as fs } from "node:fs";
import path from "node:path";

function resolveTemplatesRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "packages", "ui", "templates");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "packages", "ui", "templates");
}

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const dir = resolveTemplatesRoot();
    const file = path.join(dir, `${params.name}.json`);
    const buf = await fs.readFile(file, "utf8");
    const data = JSON.parse(buf);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
