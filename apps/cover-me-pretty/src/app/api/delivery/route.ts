// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
// apps/cover-me-pretty/src/app/api/delivery/route.ts
import "@acme/zod-utils/initZod";
import {
  initPlugins,
  type PaymentPayload,
  type PaymentProvider,
  type ShippingProvider as BaseShippingProvider,
  type ShippingRequest,
  type WidgetComponent,
  type WidgetProps,
} from "@acme/platform-core/plugins";
import { parseJsonBody } from "@acme/lib/http/server";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
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

const PLUGINS_ENV_KEYS = [
  "PREMIER_SHIPPING_PLUGINS_DIR",
  "SHOP_PLUGINS_DIR",
  "PLUGINS_DIR",
];

function isSafePath(p: string): boolean {
  // Basic validation: reject null bytes and overly long inputs.
  // Additional normalization is handled by path.resolve below.
  return !p.includes("\0") && p.length < 4096;
}

function resolvePluginsDir(): string {
  for (const key of PLUGINS_ENV_KEYS) {
    const configured = process.env[key];
    if (configured) {
      const resolved = path.resolve(configured);
      if (isSafePath(resolved)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-1234: resolved path validated above; read-only existence check
        if (fs.existsSync(resolved)) {
          return resolved;
        }
      }
    }
  }

  const visited = new Set<string>();
  let current = process.cwd();

  while (!visited.has(current)) {
    const candidate = path.join(current, "packages", "plugins");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-1234: candidate is deterministic from current working tree
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    visited.add(current);
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error(
    "Unable to locate packages/plugins directory. Set PREMIER_SHIPPING_PLUGINS_DIR to override the search path." // i18n-exempt -- I18N-123 internal error intended for logs, not end-users [ttl=2025-06-30]
  );
}

async function getPlugins(): Promise<PremierPluginManager> {
  if (!pluginsReady) {
    const pluginsDir = resolvePluginsDir();

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
      { error: "Premier shipping not available" }, // i18n-exempt -- I18N-123 API error string; UI will present localized copy [ttl=2025-06-30]
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
      { error: "Premier shipping not available" }, // i18n-exempt -- I18N-123 API error string; UI will present localized copy [ttl=2025-06-30]
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
