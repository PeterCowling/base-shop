// apps/cover-me-pretty/src/app/api/orders/route.ts
import { NextResponse } from "next/server";

import { getCustomerSession } from "@acme/auth";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { getOrdersForCustomer } from "@acme/platform-core/orders";

import shop from "../../../../shop.json";

export const runtime = "nodejs";

export async function GET() {
  const t = await getServerTranslations("en");
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: t("api.orders.unauthorized") }, { status: 401 });
  }
  try {
    const orders = await getOrdersForCustomer(shop.id, session.customerId);
    return NextResponse.json({ ok: true, orders });
  } catch {
    return NextResponse.json({ error: t("api.orders.fetchFailed") }, { status: 500 });
  }
}
