import { NextResponse } from "next/server";

import {
  readRepo,
  writeRepo,
} from "@acme/platform-core/repositories/products.server";
import type { ProductPublication } from "@acme/types";

import { createProductSchema } from "@/lib/adminSchemas";

const SHOP = "caryina";

/** Returns crypto.randomUUID; falls back to node:crypto in jsdom test environments. */
function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CARYINA-AUTH-01: jsdom lacks crypto.randomUUID; dead path in Worker/Node 18+
  const { webcrypto } = require("node:crypto") as typeof import("node:crypto");
  return webcrypto.randomUUID();
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { sku, title, description, price, currency, status, media, forSale } = parsed.data;
  const now = new Date().toISOString();

  const product: ProductPublication = {
    id: generateId(),
    sku,
    title: { en: title, de: title, it: title },
    description: { en: description, de: description, it: description },
    price,
    currency,
    media,
    created_at: now,
    updated_at: now,
    shop: SHOP,
    status,
    row_version: 1,
    forSale,
    forRental: false,
  };

  const existing = await readRepo(SHOP);
  await writeRepo(SHOP, [...existing, product]);

  return NextResponse.json({ ok: true, data: product }, { status: 201 });
}
