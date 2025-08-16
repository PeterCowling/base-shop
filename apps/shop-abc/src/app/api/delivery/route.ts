// apps/shop-abc/src/app/api/delivery/route.ts
import "@acme/lib/initZod";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import { initPlugins } from "@acme/platform-core/plugins";
import shop from "../../../../shop.json";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getShopSettings } from "@platform-core/repositories/settings.server";

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
    date: z.string(),
    window: z.string(),
    carrier: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  if (!shop.shippingProviders?.includes("premier-shipping")) {
    return NextResponse.json(
      { error: "Premier shipping not available" },
      { status: 400 },
    );
  }

  const parsed = await parseJsonBody(req, schema, "1mb");
  if (!parsed.success) return parsed.response;

  const settings = await getShopSettings(shop.id);
  if (!settings.luxuryFeatures?.premierDelivery || !settings.premierDelivery) {
    return NextResponse.json(
      { error: "Premier shipping not available" },
      { status: 400 },
    );
  }
  const manager = await pluginsReady;
  const provider = manager.shipping.get("premier-shipping") as
    | {
        schedulePickup: (
          region: string,
          date: string,
          hourWindow: string,
          carrier?: string,
        ) => void;
      }
    | undefined;

  if (!provider) {
    return NextResponse.json(
      { error: "Premier shipping not available" },
      { status: 400 },
    );
  }

  try {
    const { region, date, window, carrier } = parsed.data;
    if (
      !settings.premierDelivery.regions.includes(region) ||
      !settings.premierDelivery.windows.includes(window)
    ) {
      return NextResponse.json(
        { error: "Invalid selection" },
        { status: 400 },
      );
    }
    provider.schedulePickup(region, date, window, carrier);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
