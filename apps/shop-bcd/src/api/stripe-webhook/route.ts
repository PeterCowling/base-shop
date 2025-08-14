import "@acme/lib/initZod";
import { z } from "zod";
import { handleStripeWebhook } from "@platform-core/stripe-webhook";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const stripeEventSchema = z
  .object({
    type: z.string(),
    data: z.object({ object: z.any() }),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = stripeEventSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.format() }, { status: 400 });
  }
  await handleStripeWebhook("bcd", parsed.data);
  return NextResponse.json({ received: true });
}
