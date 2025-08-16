// apps/shop-abc/src/app/api/return-request/route.ts
import "@acme/lib/initZod";

import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import { createReturnAuthorization } from "@platform-core/returnAuthorization";
import { sendEmail } from "@acme/email";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import shop from "../../../../shop.json";

export const runtime = "nodejs";

const RequestSchema = z
  .object({
    orderId: z.string(),
    email: z.string().email(),
    hasTags: z.boolean().optional(),
    isWorn: z.boolean().optional(),
  })
  .strict();

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, RequestSchema, "1mb");
  if (!parsed.success) return parsed.response;
  const { orderId, email, hasTags = true, isWorn = false } = parsed.data;

  const cfg = await getReturnLogistics();
  const settings = await getShopSettings(shop.id);
  if (!settings.luxuryFeatures.returns) {
    return NextResponse.json(
      { ok: false, error: "returns disabled" },
      { status: 403 },
    );
  }
  if (
    settings.luxuryFeatures.strictReturnConditions &&
    ((cfg.requireTags && !hasTags) || (!cfg.allowWear && isWorn))
  ) {
    return NextResponse.json(
      { ok: false, error: "Return rejected" },
      { status: 400 },
    );
  }

  const ra = await createReturnAuthorization({ orderId });

  await sendEmail(
    email,
    `Return Authorization ${ra.raId}`,
    `Your return request for order ${orderId} has been received. Your RA number is ${ra.raId}.`,
  );

  return NextResponse.json({ ok: true, raId: ra.raId });
}
