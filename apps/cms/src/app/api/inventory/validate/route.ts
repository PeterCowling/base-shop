import { type NextRequest, NextResponse } from "next/server";
import type { z } from "zod";

import {
  type InventoryValidationRequest,
  validateInventoryAvailability,
} from "@acme/platform-core/inventoryValidation";
import {
  inventoryValidationBodySchema,
  normalizeInventoryValidationItem,
} from "@acme/platform-core/types/inventory";

export const runtime = "nodejs";

/**
 * Inventory Validation Endpoint
 *
 * Used by Workers and edge runtimes to validate inventory availability
 * against the centralized inventory authority.
 *
 * POST /api/inventory/validate
 * Authorization: Bearer <token>
 * Body: { shopId: string, items: InventoryValidationRequest[] }
 *
 * Responses:
 * - 200: { ok: true } - All items available
 * - 409: { ok: false, code: "inventory_insufficient", items: [...] } - Insufficient stock
 * - 401: Unauthorized
 * - 503: Service unavailable (backend error)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Verify authorization token
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.INVENTORY_AUTHORITY_TOKEN}`;

  if (!process.env.INVENTORY_AUTHORITY_TOKEN || authHeader !== expectedAuth) {
    console.error("[Inventory Authority] Unauthorized validation request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate request body
  let body: z.infer<typeof inventoryValidationBodySchema>;
  try {
    const rawBody = await req.json();
    const parsed = inventoryValidationBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    body = parsed.data;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const headerShopId = req.headers.get("x-shop-id")?.trim() || undefined;
  const bodyShopId = body.shopId;

  if (headerShopId && bodyShopId && headerShopId !== bodyShopId) {
    return NextResponse.json(
      { error: "Invalid request", details: { shopId: ["x-shop-id does not match shopId"] } },
      { status: 400 },
    );
  }

  const shopId = headerShopId ?? bodyShopId;
  if (!shopId) {
    return NextResponse.json(
      { error: "Invalid request", details: { shopId: ["shopId is required"] } },
      { status: 400 },
    );
  }

  const normalizedItems: InventoryValidationRequest[] = [];
  for (const item of body.items) {
    const normalized = normalizeInventoryValidationItem(item);
    if ("error" in normalized) {
      return NextResponse.json(
        { error: "Invalid request", details: { items: [normalized.error] } },
        { status: 400 },
      );
    }
    normalizedItems.push(normalized);
  }

  // Validate inventory
  try {
    const result = await validateInventoryAvailability(
      shopId,
      normalizedItems,
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "inventory_insufficient",
          items: "insufficient" in result ? result.insufficient : [],
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Inventory Authority] Validation error:", err);
    return NextResponse.json(
      {
        error: "Service unavailable",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

/**
 * Health Check Endpoint
 *
 * GET /api/inventory/validate
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Verify authorization token
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.INVENTORY_AUTHORITY_TOKEN}`;

  if (!process.env.INVENTORY_AUTHORITY_TOKEN || authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    service: "inventory-authority",
    timestamp: new Date().toISOString(),
  });
}
