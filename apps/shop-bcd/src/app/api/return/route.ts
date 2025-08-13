// apps/shop-bcd/src/app/api/return/route.ts
import "@acme/lib/initZod";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

export const runtime = "edge";

const ReturnSchema = z.object({ sessionId: z.string() }).strict();

function createUpsLabel(sessionId: string) {
  const trackingNumber = `1Z${Math.random().toString().slice(2, 12)}`;
  const labelUrl = `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
  return { trackingNumber, labelUrl };
}

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, ReturnSchema, "1mb");
  if (!parsed.success) return parsed.response;
  const { sessionId } = parsed.data;
  const { trackingNumber, labelUrl } = createUpsLabel(sessionId);
  return NextResponse.json({ ok: true, trackingNumber, labelUrl });
}
