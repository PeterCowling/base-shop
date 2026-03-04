"use client";

import * as React from "react";
import Link from "next/link";

import {
  Button,
  Price,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";
import { QuantityInput } from "@acme/design-system/molecules";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

import { XaFadeImage } from "../../components/XaFadeImage";
import { useCart } from "../../contexts/XaCartContext";
import { xaI18n } from "../../lib/xaI18n";

export default function CartPage() {
  const [currency] = useCurrency();
  const [cart, dispatch] = useCart();
  const lines = React.useMemo(() => Object.entries(cart), [cart]);

  const subtotal = React.useMemo(() => {
    return lines.reduce((sum, [, line]) => sum + line.qty * (line.sku.prices?.[currency] ?? line.sku.price ?? 0), 0);
  }, [lines, currency]);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Cart</h1>
      </Section>

      <Section padding="default">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center rounded-sm border border-border-1 px-6 py-12 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {xaI18n.t("xaB.src.app.cart.page.l38c42")}
            </div>
            <Link
              href="/collections/all"
              className="mt-4 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              {xaI18n.t("xaB.src.app.cart.page.l40c67")}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-sm border border-border-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16" />
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-end">Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(([id, line]) => {
                    const image = line.sku.media?.filter((m) => m.type === "image" && m.url.trim())[0];
                    return (
                    <TableRow key={id}>
                      <TableCell className="w-16 p-2">
                        <div className="relative aspect-square w-16 overflow-hidden rounded-sm bg-surface">
                          {image ? (
                            <XaFadeImage
                              src={image.url}
                              alt={image.altText ?? line.sku.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            // eslint-disable-next-line ds/enforce-layout-primitives -- XA-0022: thumbnail fallback leaf
                            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
                              {line.sku.title.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{line.sku.title}</div>
                          {line.size ? (
                            <div className="text-xs text-muted-foreground">
                              Size: {line.size}
                            </div>
                          ) : null}
                          <div className="text-xs text-muted-foreground">
                            <Price
                              amount={line.sku.prices?.[currency] ?? line.sku.price}
                              currency={currency}
                              className="font-medium"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <QuantityInput
                          value={line.qty}
                          min={1}
                          max={line.sku.stock}
                          onChange={(value) => {
                            void dispatch({ type: "setQty", id, qty: value });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-end">
                        <Price
                          amount={line.qty * (line.sku.prices?.[currency] ?? line.sku.price)}
                          currency={currency}
                          className="font-semibold"
                        />
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          variant="outline"
                          onClick={() => void dispatch({ type: "remove", id })}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg font-semibold">
                Subtotal: <Price amount={subtotal} currency={currency} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void dispatch({ type: "clear" })}>
                  Clear cart
                </Button>
                <Button asChild>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Section>
    </main>
  );
}
