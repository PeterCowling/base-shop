"use client";

import * as React from "react";
/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy cart page pending i18n overhaul */
import Link from "next/link";

import { Section } from "@acme/ui/atoms/Section";
import {
  Button,
  Price,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/components/atoms";
import { QuantityInput } from "@acme/ui/components/molecules";

import { useCart } from "../../contexts/XaCartContext";

export default function CartPage() {
  const [cart, dispatch] = useCart();
  const lines = React.useMemo(() => Object.entries(cart), [cart]);

  const subtotal = React.useMemo(() => {
    return lines.reduce((sum, [, line]) => sum + line.qty * (line.sku.price ?? 0), 0);
  }, [lines]);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Cart</h1>
      </Section>

      <Section padding="default">
        {lines.length === 0 ? (
          <div className="rounded-lg border p-6">
            <div className="font-medium">Your cart is empty.</div>
            <div className="mt-2 text-sm text-muted-foreground">
              <Link href="/collections/all" className="underline">
                Continue shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
	                  <TableRow>
	                    <TableHead>Item</TableHead>
	                    <TableHead>Qty</TableHead>
	                    <TableHead className="text-end">Total</TableHead>
	                    <TableHead />
	                  </TableRow>
	                </TableHeader>
                <TableBody>
                  {lines.map(([id, line]) => (
                    <TableRow key={id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{line.sku.title}</div>
                          {line.size ? (
                            <div className="text-xs text-muted-foreground">
                              Size: {line.size}
                            </div>
                          ) : null}
                          <div className="text-xs text-muted-foreground">
                            <Price amount={line.sku.price} className="font-medium" />
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
	                        <Price amount={line.qty * line.sku.price} className="font-semibold" />
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
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg font-semibold">
                Subtotal: <Price amount={subtotal} />
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
