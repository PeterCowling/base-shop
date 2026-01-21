import { type NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { validateShopName } from "@acme/lib";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";

import { writeJsonFile } from "@/lib/server/jsonIO";

interface Body {
  shop: string;
  id: string;
  title: string;
  description: string;
}

export async function POST(req: NextRequest) {
  const t = await getServerTranslations("en");
  const body = (await req.json().catch(() => ({}))) as Partial<Body>;
  if (!body.shop || !body.id || !body.title || !body.description) {
    return NextResponse.json({ error: t("api.common.invalidRequest") }, { status: 400 });
  }

  const shop = validateShopName(body.shop);

  // i18n-exempt -- CMS-2652 [ttl=2026-01-01] non-UI module specifier
  const { generateMeta } = await import("@acme/lib/generateMeta");

  const result = await generateMeta({
    id: body.id,
    title: body.title,
    description: body.description,
  });

  // i18n-exempt -- CMS-1013 [ttl=2026-01-01] non-UI filename constant
  const file = path.join(DATA_ROOT, shop, "seo.json");
  let current: Record<string, unknown> = {};
  try {
    // Constrained to validated shop data directory
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-2651: path is restricted to DATA_ROOT + validated shop
    const buf = await fs.readFile(file, "utf8");
    current = JSON.parse(buf) as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  current[body.id] = result;
  await writeJsonFile(file, current);

  return NextResponse.json(result);
}
