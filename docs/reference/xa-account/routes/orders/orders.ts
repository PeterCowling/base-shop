import { NextResponse } from "next/server";

import { readAccountSession } from "../../../../lib/accountAuth";
import {
  type AccountOrderLine,
  accountOrderTotal,
  createOrderForAccount,
  listOrdersForAccountUser,
} from "../../../../lib/accountStore";
import { PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestBody";

export const runtime = "nodejs";
const ACCOUNT_ORDERS_PAYLOAD_MAX_BYTES = 64 * 1024;

function normalizeCurrency(value: unknown) {
  if (typeof value !== "string") return "USD";
  const normalized = value.trim().toUpperCase();
  if (/^[A-Z]{3,12}$/.test(normalized)) return normalized;
  return "USD";
}

function normalizeOrderLines(value: unknown): AccountOrderLine[] {
  if (!Array.isArray(value)) return [];

  const out: AccountOrderLine[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const skuId =
      typeof (candidate as { skuId?: unknown }).skuId === "string"
        ? (candidate as { skuId: string }).skuId.trim().slice(0, 120)
        : "";
    const title =
      typeof (candidate as { title?: unknown }).title === "string"
        ? (candidate as { title: string }).title.trim().slice(0, 240)
        : "";
    const size =
      typeof (candidate as { size?: unknown }).size === "string"
        ? (candidate as { size: string }).size.trim().slice(0, 40)
        : undefined;
    const qtyRaw = (candidate as { qty?: unknown }).qty;
    const unitPriceRaw = (candidate as { unitPrice?: unknown }).unitPrice;

    const qty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw);
    const unitPrice =
      typeof unitPriceRaw === "number" ? unitPriceRaw : Number(unitPriceRaw);

    if (!skuId || !title) continue;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) continue;

    out.push({
      skuId,
      title,
      size: size || undefined,
      qty: Math.floor(qty),
      unitPrice,
    });
  }

  return out;
}

export async function GET(request: Request) {
  const session = await readAccountSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { orders, storeMode } = await listOrdersForAccountUser(session.userId);
  return NextResponse.json({
    ok: true,
    storeMode,
    orders: orders.map((order) => ({
      ...order,
      total: accountOrderTotal(order),
    })),
  });
}

export async function POST(request: Request) {
  const session = await readAccountSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await readJsonBodyWithLimit(request, ACCOUNT_ORDERS_PAYLOAD_MAX_BYTES)) as Record<
      string,
      unknown
    >;
  } catch (error) {
    const status = error instanceof PayloadTooLargeError ? 413 : 400;
    return NextResponse.json(
      { ok: false, error: status === 413 ? "payload_too_large" : "invalid" },
      { status },
    );
  }

  const lines = normalizeOrderLines(payload.lines);
  if (!lines.length) {
    return NextResponse.json({ ok: false, error: "missing_lines" }, { status: 400 });
  }

  const currency = normalizeCurrency(payload.currency);
  const created = await createOrderForAccount({
    userId: session.userId,
    email: session.email,
    currency,
    lines,
  });

  return NextResponse.json({
    ok: true,
    storeMode: created.storeMode,
    order: {
      ...created.order,
      total: accountOrderTotal(created.order),
    },
  });
}
