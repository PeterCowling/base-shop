import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { AxerveError, callPayment } from "@acme/axerve";
import { CART_COOKIE, decodeCartCookie } from "@acme/platform-core/cartCookie";
import { deleteCart, getCart } from "@acme/platform-core/cartStore";
import { sendSystemEmail } from "@acme/platform-core/email";

export const runtime = "nodejs";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

    if (cartId) {
      await deleteCart(cartId);
    }

    // Fire-and-forget merchant notification — must not affect payment response
    const notifyEmail = process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com";
    const itemLines = Object.values(cart)
      .map(
        (line) =>
          `<tr><td>${line.sku.title}</td><td>${line.qty}</td><td>€${(line.sku.price / 100).toFixed(2)}</td><td>€${((line.sku.price * line.qty) / 100).toFixed(2)}</td></tr>`,
      )
      .join("");
    const emailHtml = `
      <h2>New order received</h2>
      <table border="1" cellpadding="4" cellspacing="0">
        <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
        <tbody>${itemLines}</tbody>
      </table>
      <p><strong>Total: €${(totalCents / 100).toFixed(2)}</strong></p>
      <p>Transaction ID: ${shopTransactionId}</p>
      <p>Axerve ref: ${result.transactionId}</p>
    `;
    void sendSystemEmail({
      to: notifyEmail,
      subject: `New order — ${shopTransactionId}`,
      html: emailHtml,
    }).catch((err: unknown) => {
      console.error("Merchant notification email failed", err); // i18n-exempt -- developer log
    });
    const recipientEmail = cardFields.buyerEmail?.trim();
    if (recipientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      const customerItemLines = Object.values(cart)
        .map(
          (line) =>
            `<tr><td>${escHtml(line.sku.title)}</td><td>${line.qty}</td><td>€${(line.sku.price / 100).toFixed(2)}</td><td>€${((line.sku.price * line.qty) / 100).toFixed(2)}</td></tr>`,
        )
        .join("");
      const customerEmailHtml = `
        <h2>Order confirmed — thank you!</h2>
        <p>Hi${cardFields.buyerName ? ` ${escHtml(cardFields.buyerName)}` : ""},</p>
        <p>Your order has been received and payment processed successfully.</p>
        <table border="1" cellpadding="4" cellspacing="0">
          <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
          <tbody>${customerItemLines}</tbody>
        </table>
        <p><strong>Total: €${(totalCents / 100).toFixed(2)}</strong></p>
        <p>Order reference: ${shopTransactionId}</p>
        <p>Payment reference: ${result.transactionId ?? ""}</p>
        <p>If you have any questions, reply to this email or contact our support.</p>
      `;
      void sendSystemEmail({
        to: recipientEmail,
        subject: `Order confirmed — ${shopTransactionId}`,
        html: customerEmailHtml,
      }).catch((err: unknown) => {
        console.error("Customer confirmation email failed", err); // i18n-exempt -- developer log
      });
      console.info("Customer confirmation email dispatched", { shopTransactionId }); // i18n-exempt -- developer log
    }

    const successRes = NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      amount: totalCents,
      currency: "eur",
    });
    // Expire the cart cookie so the browser doesn't send a stale cart ID
    successRes.headers.set(
      "Set-Cookie",
      `${CART_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure; HttpOnly`,
    );
    return successRes;
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
