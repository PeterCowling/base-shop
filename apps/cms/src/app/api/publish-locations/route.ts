import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { join } from "path";
import { resolveDataRoot } from "@platform-core/dataRoot";

export async function GET() {
  try {
    // Use monorepo data root so this works when the app CWD is apps/cms
    // resolveDataRoot() -> <repo>/data/shops, so step up one level to <repo>/data
    const dataRoot = resolveDataRoot();
    const file = join(dataRoot, "..", "publish-locations.json");
    const buf = await fs.readFile(file, "utf8");
    const data = JSON.parse(buf);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 404 }
    );
  }
}
