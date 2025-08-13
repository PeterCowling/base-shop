// apps/shop-bcd/src/app/api/delivery/schedule/route.ts
import "@acme/lib/initZod";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import shop from "../../../../shop.json";

export const runtime = "edge";

const schema = z
  .object({
    region: z.string(),
    window: z.string(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, schema, "1mb");
  if (!parsed.success) return parsed.response;

  const settings = await getShopSettings(shop.id);
  const pd = settings.premierDelivery;
  if (!pd) {
    return NextResponse.json({ error: "Premier delivery not available" }, { status: 400 });
  }
  const { region, window } = parsed.data;
  if (!pd.regions.includes(region) || !pd.windows.includes(window)) {
    return NextResponse.json({ error: "Invalid selection" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("delivery", JSON.stringify({ region, window }), { path: "/" });
  return res;
}
