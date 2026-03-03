import { NextResponse } from "next/server";

import {
  accountOrderTotal,
  findOrdersForTracking,
  normalizeAccountEmail,
} from "../../../../lib/accountStore";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestBody";

export const runtime = "nodejs";
const TRACK_PAYLOAD_MAX_BYTES = 8 * 1024;

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const limit = rateLimit({
    key: `account-track:${requestIp || "unknown"}`,
    windowMs: 15 * 60 * 1000,
    max: 20,
  });
  if (!limit.allowed) {
    const headers = new Headers();
    applyRateLimitHeaders(headers, limit);
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await readJsonBodyWithLimit(request, TRACK_PAYLOAD_MAX_BYTES)) as Record<string, unknown>;
  } catch (error) {
    const status = error instanceof PayloadTooLargeError ? 413 : 400;
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: status === 413 ? "payload_too_large" : "invalid" },
        { status },
      ),
      limit,
    );
  }

  const orderNumber =
    typeof payload.order === "string" ? payload.order.trim().slice(0, 20) : "";
  const email = normalizeAccountEmail(
    typeof payload.email === "string" ? payload.email : "",
  );

  if (!orderNumber || !email) {
    return withRateHeaders(NextResponse.json({ ok: false, error: "missing" }, { status: 400 }), limit);
  }

  const { orders } = await findOrdersForTracking(orderNumber, email);
  return withRateHeaders(
    NextResponse.json({
      ok: true,
      rows: orders.map((order) => ({
        order: order.number,
        status: order.status,
        total: accountOrderTotal(order),
        currency: order.currency,
      })),
    }),
    limit,
  );
}
