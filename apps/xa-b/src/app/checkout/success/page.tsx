"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

import { findOrderByNumber } from "../../../lib/ordersStore";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";
  const order = orderNumber ? findOrderByNumber(orderNumber) : null;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Order confirmed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {order ? (
            <>
              Order <span className="font-medium">{order.number}</span> is{" "}
              <span className="font-medium">{order.status}</span>.
            </>
          ) : (
            "We couldn’t load that order in this browser."
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
          <Button variant="outline" asChild>
            <Link href="/account/orders">Order history</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account/trackingorder">Track order</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/collections/all">Continue shopping</Link>
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
