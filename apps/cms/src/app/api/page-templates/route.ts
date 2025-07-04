import { NextResponse } from "next/server";
import fsSync, { promises as fs } from "node:fs";
import path from "node:path";

function resolveTemplatesRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(
      dir,
      "packages",
      "ui",
      "components",
      "templates"
    );
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(
    process.cwd(),
    "packages",
    "ui",
    "components",
    "templates"
  );
}

export async function GET() {
  try {
    const dir = resolveTemplatesRoot();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const templates = [] as Array<{ name: string; components: unknown[] }>;
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".json")) {
        const file = path.join(dir, e.name);
        const json = JSON.parse(await fs.readFile(file, "utf8"));
        templates.push({
          name: json.name ?? path.parse(e.name).name,
          components: json.components ?? [],
        });
      }
    }
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json([]);
  }
}
