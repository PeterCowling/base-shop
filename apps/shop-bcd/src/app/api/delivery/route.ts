// apps/shop-bcd/src/app/api/delivery/route.ts
import "@acme/lib/initZod";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import { initPlugins } from "@acme/platform-core/plugins";
import shop from "../../../../shop.json";
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

  const parsed = await parseJsonBody<z.infer<typeof schema>>(req, schema, "1mb");
  if (parsed.success === false) {
    return parsed.response;
  }

  const manager = await pluginsReady;
  const provider = manager.shipping.get("premier-shipping") as unknown as
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
    provider.schedulePickup(region, date, window, carrier);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
