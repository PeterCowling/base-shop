// apps/cms/src/app/api/page-templates/[name]/route.ts

import { NextResponse, type NextRequest } from "next/server";
import fsSync, { promises as fs } from "fs";
import path from "path";

export function resolveTemplatesRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidates = [
      path.join(dir, "packages", "ui", "components", "templates"),
      path.join(dir, "packages", "ui", "src", "components", "templates"),
    ];
    for (const candidate of candidates) {
      // ESLint: workspace-only paths, no user input
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fsSync.existsSync(candidate)) return candidate;
    }
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  try {
    const { resolveTemplatesRoot } = await import("./route");
    const dir = resolveTemplatesRoot();
    const { name } = await context.params;
    // Constrain template name to safe characters and ensure the resolved path stays within the templates dir
    const safeName = String(name).replace(/[^a-zA-Z0-9_-]/g, "");
    const file = path.join(dir, `${safeName}.json`);
    const resolved = path.resolve(file);
    if (!resolved.startsWith(path.resolve(dir) + path.sep)) {
      return NextResponse.json({ error: "Invalid template name" }, { status: 400 });
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const buf = await fs.readFile(file, "utf8");
    const data = JSON.parse(buf);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
