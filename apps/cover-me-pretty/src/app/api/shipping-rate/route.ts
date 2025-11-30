// apps/cover-me-pretty/src/app/api/shipping-rate/route.ts
import "@acme/zod-utils/initZod";
import { getShippingRate } from "@platform-core/shipping/index";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import shop from "../../../../shop.json";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

// Accessing shop settings requires filesystem access via Node's `fs` module.
// Switch to the Node.js runtime so these APIs are available during build and
// execution.
export const runtime = "nodejs";

const schema = z
  .object({
    provider: z.enum(["ups", "dhl", "premier-shipping"]),
    fromPostalCode: z.string(),
    toPostalCode: z.string(),
    weight: z.number(),
    region: z.string().optional(),
    window: z.string().optional(),
    carrier: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.provider === "premier-shipping") {
      if (!val.region) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["region"], message: "Required" });
      }
      if (!val.window) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["window"], message: "Required" });
      }
      if (!val.carrier) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["carrier"], message: "Required" });
      }
    }
  });

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, schema, "1mb");
  if ("response" in parsed) {
    return parsed.response;
  }

  const body = parsed.data;
  let premierDelivery: Parameters<typeof getShippingRate>[0]["premierDelivery"];
  let provider = body.provider;
  if (body.provider === "premier-shipping") {
    const settings = await getShopSettings(shop.id);
    if (
      settings.luxuryFeatures?.premierDelivery &&
      settings.premierDelivery &&
      body.region &&
      settings.premierDelivery.regions.includes(body.region)
    ) {
      premierDelivery = settings.premierDelivery;
    } else {
      provider = "dhl";
    }
  }

  try {
    const rate = await getShippingRate({
      provider,
      fromPostalCode: body.fromPostalCode,
      toPostalCode: body.toPostalCode,
      weight: body.weight,
      region: body.region,
      window: body.window,
      carrier: body.carrier,
      premierDelivery,
    });
    return NextResponse.json(rate);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
