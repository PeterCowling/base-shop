// apps/cover-me-pretty/src/app/success/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getShopIdFromRequest } from "@acme/platform-core/shopContext";
import { readOrders } from "@acme/platform-core/repositories/rentalOrders.server";
import shop from "../../../../shop.json";

export const runtime = "nodejs";

const REQUEST_ID_HEADER = "x-request-id";

function getOrCreateRequestId(headers: Headers): string {
  const existing = headers.get(REQUEST_ID_HEADER);
  if (existing) return existing;
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

type ResponseBody =
  | { ok: true; state: "processing" }
  | {
      ok: true;
      state: "finalized";
      order: { id: string; sessionId: string; status: string | null };
    }
  | { ok: false; error: string };

export async function GET(req: NextRequest): Promise<NextResponse<ResponseBody>> {
  const requestId = getOrCreateRequestId(req.headers);
  let shopId: string;
  try {
    shopId = getShopIdFromRequest(req);
  } catch {
    shopId = shop.id; // i18n-exempt -- SHOP-3205 transitional single-tenant fallback; multi-tenant deployments inject x-shop-id [ttl=2026-12-31]
  }

  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get("sessionId")?.trim() || null;
  const orderId = searchParams.get("orderId")?.trim() || null;

  if (!sessionId && !orderId) {
    const res = NextResponse.json({ ok: false as const, error: "Missing order id" }, { status: 400 }); // i18n-exempt -- SHOP-3205 machine-readable API error [ttl=2026-06-30]
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  }

  const identifier = sessionId ?? orderId;
  // Use readOrders to find the specific order
  const orders = identifier
    ? await readOrders(shopId)
    : [];
  const order = orders.find((o) =>
    identifier?.startsWith("cs_") ? o.sessionId === identifier : o.id === identifier
  ) ?? null;

  const body: ResponseBody = order
    ? {
        ok: true,
        state: "finalized",
        order: {
          id: order.id,
          sessionId: order.sessionId,
          status: order.status ?? null,
        },
      }
    : { ok: true, state: "processing" };

  const res = NextResponse.json(body, { status: 200 });
  res.headers.set(REQUEST_ID_HEADER, requestId);
  res.headers.set("cache-control", "no-store");
  return res;
}
