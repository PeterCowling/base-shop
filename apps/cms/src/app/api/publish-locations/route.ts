import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { join } from "path";

export async function GET() {
  try {
    const file = join(process.cwd(), "data", "publish-locations.json");
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
