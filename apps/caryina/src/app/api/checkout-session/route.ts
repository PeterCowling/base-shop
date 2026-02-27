import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { AxerveError, callPayment } from "@acme/axerve";
import { CART_COOKIE, decodeCartCookie } from "@acme/platform-core/cartCookie";
import { getCart } from "@acme/platform-core/cartStore";

export const runtime = "nodejs";

const REQUIRED_CARD_FIELDS = [
  "cardNumber",
  "expiryMonth",
  "expiryYear",
  "cvv",
] as const;

interface CardFields {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  buyerName?: string;
  buyerEmail?: string;
}

function parseCardFields(body: Record<string, unknown>): CardFields | null {
  for (const field of REQUIRED_CARD_FIELDS) {
    if (!body[field] || typeof body[field] !== "string") return null;
  }
  return {
    cardNumber: body.cardNumber as string,
    expiryMonth: body.expiryMonth as string,
    expiryYear: body.expiryYear as string,
    cvv: body.cvv as string,
    buyerName: typeof body.buyerName === "string" ? body.buyerName : undefined,
    buyerEmail:
      typeof body.buyerEmail === "string" ? body.buyerEmail : undefined,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const decodedCartId = decodeCartCookie(rawCookie);
  const cartId = typeof decodedCartId === "string" ? decodedCartId : undefined;
  const cart = cartId ? await getCart(cartId) : {};

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 }); // i18n-exempt -- machine-readable API error
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const cardFields = parseCardFields(body);

  if (!cardFields) {
    return NextResponse.json(
      { error: "Missing required payment fields" }, // i18n-exempt -- machine-readable API error
      { status: 400 },
    );
  }

  const totalCents = Object.values(cart).reduce(
    (sum, line) => sum + line.sku.price * line.qty,
    0,
  );
  const amountDecimal = (totalCents / 100).toFixed(2);
  const shopTransactionId = `${randomUUID()}-${cartId ?? "no-cart"}`;

  try {
    const result = await callPayment({
      shopLogin: process.env.AXERVE_SHOP_LOGIN ?? "",
      apiKey: process.env.AXERVE_API_KEY ?? "",
      uicCode: "978",
      amount: amountDecimal,
      shopTransactionId,
      ...cardFields,
    });

    if (!result.success) {
      console.error("Axerve payment KO", { // i18n-exempt -- developer log
        transactionId: result.transactionId,
        errorCode: result.errorCode,
      });
      return NextResponse.json(
        { success: false, error: result.errorDescription ?? "Payment declined" }, // i18n-exempt -- machine-readable API error
        { status: 402 },
      );
    }

    console.info("Axerve payment OK", { shopTransactionId, bankTransactionId: result.bankTransactionId }); // i18n-exempt -- developer log
    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      amount: totalCents,
      currency: "eur",
    });
  } catch (err) {
    if (err instanceof AxerveError) {
      console.error("Axerve SOAP error", err.message); // i18n-exempt -- developer log
      return NextResponse.json(
        { error: "Payment service unavailable" }, // i18n-exempt -- machine-readable API error
        { status: 502 },
      );
    }
    throw err;
  }
}
