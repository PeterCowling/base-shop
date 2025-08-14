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
    window: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.provider === "premier-shipping") {
      if (!val.region) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["region"], message: "Required" });
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
  let premierDelivery;
  if (body.provider === "premier-shipping") {
    const settings = await getShopSettings(shop.id);
    premierDelivery = settings.premierDelivery;
  }

  try {
    const rate = await getShippingRate({ ...body, premierDelivery });
    return NextResponse.json({ rate });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
