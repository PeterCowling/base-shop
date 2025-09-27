// apps/shop-bcd/src/app/api/orders/route.ts
import { getCustomerSession } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { NextResponse } from "next/server";
import shop from "../../../../shop.json";
import { useTranslations } from "@acme/i18n/useTranslations.server";

export const runtime = "nodejs";

export async function GET() {
  const t = await useTranslations("en");
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
