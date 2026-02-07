// apps/cover-me-pretty/src/app/api/orders/create/route.ts
import { promises as fs } from "node:fs";
import path from "node:path";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ulid } from "ulid";
import { z } from "zod";

import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { addOrder } from "@acme/platform-core/orders/creation";

import shop from "../../../../../shop.json";

export const runtime = "nodejs";

const Body = z.object({
  paymentIntentId: z.string().optional(),
  sessionId: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  returnDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); // i18n-exempt -- SHOP-3205 machine-readable API error [ttl=2026-06-30]
  }

  const { paymentIntentId, sessionId, amount = 0, returnDate } = parsed.data;
  const sessionRef = paymentIntentId || sessionId || ulid();
  let orderId = ulid();

  // Try primary order repository (Prisma)
  try {
    const order = await addOrder({
      shop: shop.id,
      sessionId: sessionRef,
      deposit: amount,
      expectedReturnDate: returnDate,
      currency: parsed.data.currency,
    });
    orderId = order.id;
    return NextResponse.json({ ok: true, orderId });
  } catch {
    // fall back to JSONL
  }

  try {
    const base = resolveDataRoot();
    const dir = path.join(base, shop.id);
    const file = path.join(dir, "orders.jsonl");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SHOP-3205 path uses validated shop id and data root [ttl=2026-06-30]
    await fs.mkdir(dir, { recursive: true });
    const entry = {
      id: orderId,
      shop: shop.id,
      sessionId: sessionRef,
      amount,
      returnDate,
      createdAt: new Date().toISOString(),
    };
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SHOP-3205 fallback append stays under resolved data root [ttl=2026-06-30]
    await fs.appendFile(file, JSON.stringify(entry) + "\n", "utf8");
  } catch {
    /* swallow fallback persistence errors */
  }

  return NextResponse.json({ ok: true, orderId });
}
