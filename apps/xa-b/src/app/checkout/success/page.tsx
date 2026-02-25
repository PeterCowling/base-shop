"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

import { xaI18n } from "../../../lib/xaI18n";

type OrderSummary = {
  number: string;
  status: string;
};

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";

  const [order, setOrder] = React.useState<OrderSummary | null>(null);
  const [loading, setLoading] = React.useState(Boolean(orderNumber));
  const [authRequired, setAuthRequired] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      if (!orderNumber) {
        setLoading(false);
        setOrder(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/account/orders/${encodeURIComponent(orderNumber)}`,
          { cache: "no-store" },
        );

        if (response.status === 401) {
          if (!cancelled) {
            setAuthRequired(true);
            setOrder(null);
          }
          return;
        }

        if (!response.ok) {
          if (!cancelled) {
            setOrder(null);
          }
          return;
        }

        const payload = (await response.json()) as {
          order?: { number?: string; status?: string };
        };

        if (!cancelled) {
          const nextOrder = payload.order;
          setOrder(
            nextOrder?.number && nextOrder?.status
              ? { number: nextOrder.number, status: nextOrder.status }
              : null,
          );
          setAuthRequired(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">{xaI18n.t("xaB.src.app.checkout.success.page.l20c48")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loading ? (
            "Checking order status..."
          ) : order ? (
            <>
              Order <span className="font-medium">{order.number}</span> is{" "}
              <span className="font-medium">{order.status}</span>.
            </>
          ) : authRequired ? (
            "Order placed. Sign in to view full order details."
          ) : (
            xaI18n.t("xaB.src.app.checkout.success.page.l28c13")
          )}
        </p>
      </Section>

      <Section padding="default">
        <div className="flex flex-wrap gap-3">
          {order ? (
            <Button asChild>
              <Link href={`/account/orders/${order.number}`}>View order</Link>
            </Button>
          ) : null}
          {authRequired ? (
            <Button asChild>
              <Link href="/account/login">Login</Link>
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link href="/account/orders">{xaI18n.t("xaB.src.app.checkout.success.page.l41c42")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account/trackingorder">Track order</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/collections/all">{xaI18n.t("xaB.src.app.checkout.success.page.l47c43")}</Link>
          </Button>
        </div>
      </Section>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
