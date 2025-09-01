// apps/shop-bcd/src/app/api/delivery/route.ts
import "@acme/zod-utils/initZod";
import {
  initPlugins,
  type PaymentPayload,
  type PaymentProvider,
  type ShippingProvider as BaseShippingProvider,
  type ShippingRequest,
  type WidgetComponent,
  type WidgetProps,
} from "@platform-core/plugins";
import { parseJsonBody } from "@shared-utils";
import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import shop from "../../../../shop.json";

// Ensure Node runtime (we use node path/fs)
export const runtime = "nodejs";

// Lazily initialize plugins to avoid side-effects at module import time.
interface PremierShippingProvider
  extends BaseShippingProvider<ShippingRequest> {
  schedulePickup: (
    region: string,
    date: string,
    hourWindow: string,
    carrier?: string,
  ) => void | Promise<void>;
}

type PremierPluginManager = Awaited<
  ReturnType<
    typeof initPlugins<
      PaymentPayload,
      ShippingRequest,
      WidgetProps,
      PaymentProvider<PaymentPayload>,
      PremierShippingProvider,
      WidgetComponent<WidgetProps>
    >
  >
>;

let pluginsReady: Promise<PremierPluginManager> | null = null;

function resolvePluginsDir(currentModuleUrl: string): string {
  const __dirname = path.dirname(fileURLToPath(currentModuleUrl));
  // Monorepo path to /packages/plugins from this route file
  return path.resolve(__dirname, "../../../../../../packages/plugins");
}

async function getPlugins(): Promise<PremierPluginManager> {
  if (!pluginsReady) {
    const pluginsDir = resolvePluginsDir(import.meta.url);

    // NOTE: Keep these entries pure data; avoid reading env or IO at top-level.
    const shopConfig = shop as unknown as {
      plugins?: Record<string, unknown>;
      premierDelivery?: Record<string, unknown>;
      shippingProviders?: string[];
    };

    pluginsReady = initPlugins<
      PaymentPayload,
      ShippingRequest,
      WidgetProps,
      PaymentProvider<PaymentPayload>,
      PremierShippingProvider,
      WidgetComponent<WidgetProps>
    >({
      directories: [pluginsDir],
      config: {
        ...(shopConfig.plugins ?? {}),
        "premier-shipping": shopConfig.premierDelivery ?? {},
      },
    });
  }
  return pluginsReady;
}

const schema = z
  .object({
    region: z.string(),
    date: z.string(),
    window: z.string(),
    carrier: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  // Quick capability check from shop.json
  const shippingProviders = (
    shop as { shippingProviders?: string[] }
  ).shippingProviders;
  if (!shippingProviders?.includes("premier-shipping")) {
    return NextResponse.json(
      { error: "Premier shipping not available" },
      { status: 400 }
    );
  }

  const parsed = await parseJsonBody<z.infer<typeof schema>>(
    req,
    schema,
    "1mb"
  );
  if (parsed.success === false) {
    return parsed.response;
  }

  // Initialize plugins on first request, not during build
  const manager = await getPlugins();
  const provider = manager.shipping.get("premier-shipping");

  if (!provider) {
    return NextResponse.json(
      { error: "Premier shipping not available" },
      { status: 400 }
    );
  }

  try {
    const { region, date, window, carrier } = parsed.data;
    await provider.schedulePickup(region, date, window, carrier);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
