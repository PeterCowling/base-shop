// apps/shop-abc/src/app/api/shipping-rate/route.ts
import "@acme/lib/initZod";
import { getShippingRate } from "@acme/platform-core/shipping";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import shop from "../../../../shop.json";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

export const runtime = "edge";

const schema = z
  .object({
    provider: z.enum(["ups", "dhl", "premier-shipping"]),
    fromPostalCode: z.string(),
    toPostalCode: z.string(),
    weight: z.number(),
    region: z.string().optional(),
    carrier: z.string().optional(),
    window: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.provider === "premier-shipping") {
      if (!val.region) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["region"], message: "Required" });
      }
      if (!val.carrier) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["carrier"], message: "Required" });
      }
      if (!val.window) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["window"], message: "Required" });
      }
    }
  });

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, schema, "1mb");
  if (!parsed.success) return parsed.response;

  const body = parsed.data;
  let provider = body.provider;
  let premierDelivery;
  if (provider === "premier-shipping") {
    const settings = await getShopSettings(shop.id);
    premierDelivery = settings.premierDelivery;
    const enabled = settings.luxuryFeatures?.premierDelivery;
    const allowed =
      enabled &&
      premierDelivery &&
      body.region &&
      body.carrier &&
      body.window &&
      premierDelivery.regions.includes(body.region) &&
      premierDelivery.carriers.includes(body.carrier) &&
      premierDelivery.windows.includes(body.window);
    if (!allowed) {
      provider =
        shop.shippingProviders?.find((p) => p !== "premier-shipping") || "ups";
    }
  }

  try {
    const req: any = { ...body, provider };
    if (provider === "premier-shipping") {
      req.premierDelivery = premierDelivery;
    } else {
      delete req.region;
      delete req.carrier;
      delete req.window;
      delete req.premierDelivery;
    }
    const rate = await getShippingRate(req);
    return NextResponse.json(rate as any);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
