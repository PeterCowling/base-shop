// packages/template-app/src/app/success/status/route.ts
import { type NextRequest, NextResponse } from "next/server";
import {
  readOrderById,
  readOrderBySessionId,
} from "@platform-core/repositories/rentalOrders.server";
import {
  getOrCreateRequestId,
  getShopIdFromHeaders,
  REQUEST_ID_HEADER,
} from "@platform-core/shopContext";

export const runtime = "nodejs";

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
  const shopId = getShopIdFromHeaders(req.headers);
  if (!shopId) {
    const res = NextResponse.json({ ok: false as const, error: "Missing shop context" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  }

  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get("sessionId")?.trim() || null;
  const orderId = searchParams.get("orderId")?.trim() || null;

  if (!sessionId && !orderId) {
    const res = NextResponse.json({ ok: false as const, error: "Missing order id" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  }

  const identifier = sessionId ?? orderId;
  const order = identifier
    ? identifier.startsWith("cs_")
      ? await readOrderBySessionId(shopId, identifier)
      : await readOrderById(shopId, identifier)
    : null;

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
