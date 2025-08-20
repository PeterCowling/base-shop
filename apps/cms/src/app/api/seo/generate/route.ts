import { NextRequest, NextResponse } from "next/server";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";
import fs from "node:fs/promises";
import path from "node:path";

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
  await fs.mkdir(path.dirname(file), { recursive: true });
  let current: Record<string, unknown> = {};
  try {
    const buf = await fs.readFile(file, "utf8");
    current = JSON.parse(buf) as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  current[body.id] = result;
  await fs.writeFile(file, JSON.stringify(current, null, 2), "utf8");

  return NextResponse.json(result);
}
