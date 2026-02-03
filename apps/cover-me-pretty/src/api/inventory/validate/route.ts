import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { INSUFFICIENT_STOCK_ERROR } from "@acme/platform-core/checkout/session";
import {
  type InventoryValidationRequest,
  validateInventoryAvailability,
} from "@acme/platform-core/inventoryValidation";
import {
  inventoryValidationBodySchema,
  normalizeInventoryValidationItem,
} from "@acme/platform-core/types/inventory";

import shop from "../../../../shop.json";

export const runtime = "nodejs";

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

  const parsed = inventoryValidationBodySchema.safeParse(
    await req.json().catch(() => undefined),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 400 },
    );
  }

  const headerShopId = req.headers.get("x-shop-id")?.trim() || undefined;
  const bodyShopId = parsed.data.shopId;

  if (headerShopId && bodyShopId && headerShopId !== bodyShopId) {
    return NextResponse.json(
      { error: "Invalid request" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 400 },
    );
  }

  if (headerShopId && headerShopId !== shop.id) {
    return NextResponse.json(
      { error: "Invalid request" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 400 },
    );
  }

  if (bodyShopId && bodyShopId !== shop.id) {
    return NextResponse.json(
      { error: "Invalid request" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 400 },
    );
  }

  const normalizedItems: InventoryValidationRequest[] = [];
  for (const item of parsed.data.items) {
    const normalized = normalizeInventoryValidationItem(item);
    if ("error" in normalized) {
      return NextResponse.json(
        { error: "Invalid request" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
        { status: 400 },
      );
    }
    normalizedItems.push(normalized);
  }

  try {
    const result = await validateInventoryAvailability(
      headerShopId ?? bodyShopId ?? shop.id,
      normalizedItems,
    );
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
    console.error("Inventory validation failed", err); // i18n-exempt -- ABC-123 developer log [ttl=2025-06-30]
    return NextResponse.json(
      { error: "Inventory backend unavailable" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 503 },
    );
  }
}
