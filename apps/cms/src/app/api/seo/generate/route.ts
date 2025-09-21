import { NextRequest, NextResponse } from "next/server";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";
import fs from "fs/promises";
import path from "path";
import { writeJsonFile } from "@/lib/server/jsonIO";

interface Body {
  shop: string;
  id: string;
  title: string;
  description: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<Body>;
  if (!body.shop || !body.id || !body.title || !body.description) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const shop = validateShopName(body.shop);

  const { generateMeta } = await import("@acme/lib/generateMeta");

  const result = await generateMeta({
    id: body.id,
    title: body.title,
    description: body.description,
  });

  const file = path.join(DATA_ROOT, shop, "seo.json");
  let current: Record<string, unknown> = {};
  try {
    // Constrained to validated shop data directory
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const buf = await fs.readFile(file, "utf8");
    current = JSON.parse(buf) as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  current[body.id] = result;
  await writeJsonFile(file, current);

  return NextResponse.json(result);
}
