import { NextResponse } from "next/server";
import fsSync, { promises as fs } from "fs";
import path from "path";

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
    // Only probes known workspace paths; no user input involved
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: safe workspace path probe
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
    // Read from a constrained workspace directory
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: controlled workspace directory read
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const templates = [] as Array<{ name: string; components: unknown[] }>;
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".json")) {
        const file = path.join(dir, e.name);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: reading known JSON templates
        const json = JSON.parse(await fs.readFile(file, "utf8"));
        templates.push({
          name: json.name ?? path.parse(e.name).name,
          components: json.components ?? [],
        });
      }
    }
    return NextResponse.json(templates);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
