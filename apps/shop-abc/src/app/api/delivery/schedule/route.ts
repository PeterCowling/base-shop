// apps/shop-abc/src/app/api/delivery/schedule/route.ts
import "@acme/zod-utils/initZod";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import shop from "../../../../shop.json";
import { initPlugins } from "@platform-core/plugins";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const runtime = "edge";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.resolve(__dirname, "../../../../../../packages/plugins");
const pluginsReady = initPlugins({
  directories: [pluginsDir],
  config: {
    ...(shop as any).plugins,
    "premier-shipping": (shop as any).premierDelivery,
  },
});

const schema = z
  .object({
    region: z.string(),
    window: z.string(),
    carrier: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, schema, "1mb");
  if ("response" in parsed) return parsed.response;

  const settings = await getShopSettings(shop.id);
  const pd = settings.premierDelivery;
  if (
    !settings.luxuryFeatures?.premierDelivery ||
    !pd ||
    !pd.regions.includes(parsed.data.region) ||
    !pd.windows.includes(parsed.data.window)
  ) {
    return NextResponse.json(
      { error: "Premier delivery not available" },
      { status: 400 },
    );
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    "delivery",
    JSON.stringify({
      region: parsed.data.region,
      window: parsed.data.window,
      carrier: parsed.data.carrier,
    }),
    { path: "/" },
  );
  return res;
}

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region") ?? "";
  const settings = await getShopSettings(shop.id);
  if (
    !settings.luxuryFeatures?.premierDelivery ||
    !settings.premierDelivery ||
    !region ||
    !settings.premierDelivery.regions.includes(region)
  ) {
    return NextResponse.json({ windows: [], carriers: [] });
  }
  const manager = await pluginsReady;
  const provider = manager.shipping.get("premier-shipping") as unknown as
    | { getAvailableSlots: (region: string) => { windows: string[]; carriers: string[] } }
    | undefined;
  if (!provider) {
    return NextResponse.json({ windows: [], carriers: [] });
  }
  try {
    const slots = provider.getAvailableSlots(region);
    return NextResponse.json(slots);
  } catch {
    return NextResponse.json({ windows: [], carriers: [] });
  }
}
