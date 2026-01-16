import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { coreEnv } from "@acme/config/env/core";
import {
  validateInventoryAvailability,
} from "@acme/platform-core/inventoryValidation";
import { INSUFFICIENT_STOCK_ERROR } from "@acme/platform-core/checkout/session";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    items: z
      .array(
        z
          .object({
            sku: z.string().min(1),
            quantity: z.number().int().min(1),
            variantAttributes: z.record(z.string()).optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

function assertAuthorized(req: NextRequest): boolean {
  const token = process.env.INVENTORY_AUTHORITY_TOKEN;
  if (!token) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${token}`;
}

export async function POST(req: NextRequest) {
  if (!assertAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      { status: 400 },
    );
  }

  const shop =
    (coreEnv.NEXT_PUBLIC_DEFAULT_SHOP as string | undefined) || "shop";

  try {
    const result = await validateInventoryAvailability(shop, parsed.data.items);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: INSUFFICIENT_STOCK_ERROR,
          code: "inventory_insufficient",
          items: result.insufficient,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Inventory validation failed", err); // i18n-exempt -- ABC-123 [ttl=2025-12-31] developer log
    return NextResponse.json(
      { error: "Inventory backend unavailable" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      { status: 503 },
    );
  }
}
