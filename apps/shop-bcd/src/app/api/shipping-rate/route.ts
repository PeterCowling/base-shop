// apps/shop-bcd/src/app/api/shipping-rate/route.ts
import "@acme/lib/initZod";
import { getShippingRate } from "@acme/platform-core/shipping";
import { initPlugins } from "@acme/platform-core/plugins";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import path from "node:path";
import { fileURLToPath } from "node:url";
import shop from "../../../../shop.json";

export const runtime = "edge";

const base = z.object({ provider: z.enum(["ups", "dhl", "premier-shipping"]) });
const rateSchema = base.extend({
  fromPostalCode: z.string(),
  toPostalCode: z.string(),
  weight: z.number(),
});
const scheduleSchema = base.extend({
  region: z.string(),
  date: z.string(),
  hourWindow: z.string(),
});
const schema = z.union([rateSchema, scheduleSchema]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.resolve(
  __dirname,
  "../../../../../../packages/plugins"
);
const pluginsReady = initPlugins({
  directories: [pluginsDir],
  config: (shop as any).plugins,
});

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, schema, "1mb");
  if (!parsed.success) return parsed.response;

  if (parsed.data.provider === "premier-shipping") {
    const manager = await pluginsReady;
    const provider = manager.shipping.get("premier-shipping");
    provider?.schedulePickup(
      (parsed.data as any).region,
      (parsed.data as any).date,
      (parsed.data as any).hourWindow,
    );
    return NextResponse.json({ scheduled: true });
  }

  try {
    const rate = await getShippingRate(parsed.data as any);
    return NextResponse.json({ rate });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
