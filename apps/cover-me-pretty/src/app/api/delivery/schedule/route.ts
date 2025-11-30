// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
// apps/cover-me-pretty/src/app/api/delivery/schedule/route.ts
import "@acme/zod-utils/initZod";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import shop from "../../../../../shop.json";

// This route reads shop settings via `getShopSettings`, which touches the
// filesystem through Node's `fs` module. To support these Node APIs, opt into
// the Node.js runtime instead of the Edge runtime.
export const runtime = "nodejs";

const schema = z
  .object({
    region: z.string(),
    window: z.string(),
    carrier: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody<z.infer<typeof schema>>(req, schema, "1mb");
  if (parsed.success === false) {
    return parsed.response;
  }

  const settings = await getShopSettings(shop.id);
  const pd = settings.premierDelivery;
  if (
    !settings.luxuryFeatures?.premierDelivery ||
    !pd ||
    !pd.regions.includes(parsed.data.region) ||
    !pd.windows.includes(parsed.data.window)
  ) {
    return NextResponse.json(
      { error: "Premier delivery not available" }, // i18n-exempt -- I18N-123 API error string; UI will present localized copy [ttl=2025-06-30]
      { status: 400 },
    );
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    "delivery",
    JSON.stringify({ region: parsed.data.region, window: parsed.data.window, carrier: parsed.data.carrier }),
    { path: "/" },
  );
  return res;
}
