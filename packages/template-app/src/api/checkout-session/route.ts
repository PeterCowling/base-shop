// packages/template-app/src/api/checkout-session/route.ts
import { stripe } from "@/lib/stripeServer";
import { CART_COOKIE, decodeCartCookie } from "@platform-core/src/cartCookie";
import { priceForDays } from "@platform-core/src/pricing";
import { getProductById } from "@platform-core/src/products";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

/* ------------------------------------------------------------------
 * Types held in the cart cookie
 * ------------------------------------------------------------------ */
interface CartSku {
  id: string;
  title: string;
  deposit: number;
}

interface CartItem {
  sku: CartSku;
  qty: number;
  size?: string;
}

type Cart = Record<string, CartItem>;

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */
const DAY_MS = 86_400_000;

/** Chargeable rental days */
const calculateRentalDays = (returnDate?: string): number => {
  if (!returnDate) return 1;
  const end = new Date(returnDate).getTime();
  const diffDays = Math.ceil((end - Date.now()) / DAY_MS);
  return diffDays > 0 ? diffDays : 1;
};

/** Build Stripe line-items for one cart entry */
async function buildLineItemsForItem(
  item: CartItem,
  rentalDays: number
): Promise<
  [
    Stripe.Checkout.SessionCreateParams.LineItem,
    Stripe.Checkout.SessionCreateParams.LineItem,
  ]
> {
  const sku = getProductById(item.sku.id); // ← full SKU

  const baseName = item.size ? `${sku.title} (${item.size})` : sku.title;

  return [
    {
      price_data: {
        currency: "eur",
        unit_amount: (await priceForDays(sku, rentalDays)) * 100,
        product_data: { name: baseName },
      },
      quantity: item.qty,
    },
    {
      price_data: {
        currency: "eur",
        unit_amount: sku.deposit * 100,
        product_data: { name: `${baseName} deposit` },
      },
      quantity: item.qty,
    },
  ];
}

/** Cart-wide subtotals */
async function computeTotals(cart: Cart, rentalDays: number) {
  const lineTotals = await Promise.all(
    Object.values(cart).map(async (item) => {
      const sku = getProductById(item.sku.id);
      return (await priceForDays(sku, rentalDays)) * item.qty;
    })
  );

  const subtotal = lineTotals.reduce((s, n) => s + n, 0);
  const depositTotal = Object.values(cart).reduce(
    (s, item) => s + item.sku.deposit * item.qty,
    0
  );

  return { subtotal, depositTotal };
}

/* ------------------------------------------------------------------
 *  Route handler
 * ------------------------------------------------------------------ */
export const runtime = "edge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  /* 1  Decode cart -------------------------------------------------- */
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(rawCookie) as Cart;

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  /* 2  Rental days -------------------------------------------------- */
  const { returnDate } = (await req.json().catch(() => ({}))) as {
    returnDate?: string;
  };
  const rentalDays = calculateRentalDays(returnDate);

  /* 3  Stripe line-items ------------------------------------------- */
  const nested = await Promise.all(
    Object.values(cart).map((item) => buildLineItemsForItem(item, rentalDays))
  );
  const line_items = nested.flat();

  /* 4  Totals / metadata ------------------------------------------- */
  const { subtotal, depositTotal } = await computeTotals(cart, rentalDays);

  const sizesMeta = JSON.stringify(
    Object.fromEntries(
      Object.values(cart).map((item) => [item.sku.id, item.size ?? ""])
    )
  );

  /* 5  Create checkout session ------------------------------------- */
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${req.nextUrl.origin}/success`,
    cancel_url: `${req.nextUrl.origin}/cancelled`,
    payment_intent_data: {
      metadata: {
        subtotal: String(subtotal),
        depositTotal: String(depositTotal),
        returnDate: returnDate ?? "",
        rentalDays: String(rentalDays),
      },
    },
    metadata: {
      subtotal: String(subtotal),
      depositTotal: String(depositTotal),
      returnDate: returnDate ?? "",
      rentalDays: String(rentalDays),
      sizes: sizesMeta,
    },
    expand: ["payment_intent"],
  });

  /* 6  Return client credentials ----------------------------------- */
  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret;

  return NextResponse.json({ clientSecret, sessionId: session.id });
}
