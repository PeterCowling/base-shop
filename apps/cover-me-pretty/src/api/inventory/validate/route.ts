import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  validateInventoryAvailability,
  type InventoryValidationRequest,
} from "@platform-core/inventoryValidation";
import { INSUFFICIENT_STOCK_ERROR } from "@platform-core/checkout/session";
import shop from "../../../../shop.json";

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
      { error: "Unauthorized" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 400 },
    );
  }

  try {
    const items = parsed.data.items as InventoryValidationRequest[];
    const result = await validateInventoryAvailability(shop.id, items);
    if (result.ok === false) {
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
    console.error("Inventory validation failed", err); // i18n-exempt -- ABC-123 developer log [ttl=2025-06-30]
    return NextResponse.json(
      { error: "Inventory backend unavailable" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 503 },
    );
  }
}
