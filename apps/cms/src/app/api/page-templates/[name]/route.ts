// apps/cms/src/app/api/page-templates/[name]/route.ts

import { NextResponse, type NextRequest } from "next/server";
import fsSync, { promises as fs } from "fs";
import path from "path";

export function resolveTemplatesRoot(): string {
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  try {
    // `resolveTemplatesRoot` is accessed via a dynamic import so tests can
    // stub the export with `jest.spyOn`.  Directly calling the local function
    // would bypass the spy because the binding would be captured before the
    // spy runs.
    const { resolveTemplatesRoot } = await import("./route");
    const dir = resolveTemplatesRoot();
    const { name } = await context.params;
    const file = path.join(dir, `${name}.json`);
    const buf = await fs.readFile(file, "utf8");
    const data = JSON.parse(buf);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
