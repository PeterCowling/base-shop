// apps/cover-me-pretty/src/app/api/return-request/route.ts
import "@acme/zod-utils/initZod";

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
  const parsed = await parseJsonBody<z.infer<typeof RequestSchema>>(req, RequestSchema, "1mb");
  if (parsed.success === false) {
    return parsed.response;
  }
  const { orderId, email, hasTags = true, isWorn = false } = parsed.data;

  const cfg = await getReturnLogistics();
  const settings = await getShopSettings(shop.id);
  if (
    settings.luxuryFeatures.strictReturnConditions &&
    ((cfg.requireTags && !hasTags) || (!cfg.allowWear && isWorn))
  ) {
    // i18n-exempt -- DS-1234 API error identifier; not user-facing copy
    return NextResponse.json(
      { ok: false, error: "Return rejected" /* i18n-exempt -- DS-1234 API error identifier; not user-facing copy */ },
      { status: 400 },
    );
  }

  const ra = await createReturnAuthorization({ orderId });

  // i18n-exempt -- DS-1234 transactional email content; localization handled by email service
  await sendEmail(
    email,
    `Return Authorization ${ra.raId}`,
    `Your return request for order ${orderId} has been received. Your RA number is ${ra.raId}.`,
  );

  return NextResponse.json({ ok: true, raId: ra.raId });
}
