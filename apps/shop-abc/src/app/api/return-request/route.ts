// apps/shop-abc/src/app/api/return-request/route.ts
import "@acme/lib/initZod";

import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import { createReturnAuthorization } from "@platform-core/returnAuthorization";
import { sendEmail } from "@acme/email";

export const runtime = "nodejs";

const RequestSchema = z
  .object({ orderId: z.string(), email: z.string().email() })
  .strict();

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, RequestSchema, "1mb");
  if (!parsed.success) return parsed.response;
  const { orderId, email } = parsed.data;

  const raId = `RA${Date.now().toString(36).toUpperCase()}`;
  await createReturnAuthorization({
    raId,
    orderId,
    status: "pending",
    inspectionNotes: "",
  });

  await sendEmail(
    email,
    `Return Authorization ${raId}`,
    `Your return request for order ${orderId} has been received. Your RA number is ${raId}.`,
  );

  return NextResponse.json({ ok: true, raId });
}
