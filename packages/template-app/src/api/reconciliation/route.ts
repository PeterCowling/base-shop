import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { importExternalOrder } from "@acme/platform-core/orders/externalImport";

export const runtime = "nodejs";

function unauthorized(): NextResponse {
  return new NextResponse("Unauthorized", {
    status: 401,
  }); // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
}

function isAuthorized(authHeader: string | null, expected: string): boolean {
  if (!authHeader) return false;
  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);
  if (authBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(authBuffer, expectedBuffer);
}

export async function POST(req: NextRequest) {
  const token = process.env.RECONCILIATION_AUTH_TOKEN;
  if (token) {
    const auth = req.headers.get("authorization");
    const expected = `Bearer ${token}`;
    if (!isAuthorized(auth, expected)) {
      return unauthorized();
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(
      "Invalid JSON", // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      {
        status: 400,
      },
    );
  }

  if (!body || typeof body !== "object") {
    return new NextResponse(
      "Invalid payload", // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      {
        status: 400,
      },
    );
  }

  const record = body as Record<string, unknown>;
  const shop = typeof record.shop === "string" ? record.shop : undefined;
  const sessionId = typeof record.id === "string" ? record.id : undefined;
  if (!shop || !sessionId) {
    return new NextResponse(
      "Missing shop or session id", // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      {
        status: 400,
      },
    );
  }

  const order = await importExternalOrder({
    shop,
    sessionId,
    amountTotal: record.amountTotal as number | undefined,
    currency: record.currency as string | undefined,
    paymentIntentId: typeof record.paymentIntentId === "string" ? record.paymentIntentId : undefined,
    stripeCustomerId: typeof record.stripeCustomerId === "string" ? record.stripeCustomerId : undefined,
    cartId: typeof record.cartId === "string" ? record.cartId : undefined,
    orderId: typeof record.orderId === "string" ? record.orderId : undefined,
    internalCustomerId: typeof record.internalCustomerId === "string" ? record.internalCustomerId : undefined,
  });

  return NextResponse.json({ orderId: order.id });
}
