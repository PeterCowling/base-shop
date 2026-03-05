"use client";

import * as React from "react";
import Link from "next/link";

import {
  Button,
  EmptyState,
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
import { XaWhatsappEnquiryPanel } from "../../components/XaWhatsappEnquiryPanel";
import { useCart } from "../../contexts/XaCartContext";
import { siteConfig } from "../../lib/siteConfig";
import { toWhatsappTextHref } from "../../lib/support";
import { xaI18n } from "../../lib/xaI18n";

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function CartPage() {
  const [currency] = useCurrency();
  const [cart, dispatch] = useCart();
  const lines = React.useMemo(() => Object.entries(cart), [cart]);
  const [phone, setPhone] = React.useState("");

  const subtotal = React.useMemo(() => {
    return lines.reduce((sum, [, line]) => sum + line.qty * (line.sku.prices?.[currency] ?? line.sku.price ?? 0), 0);
  }, [lines, currency]);

  const whatsappHref = React.useMemo(() => {
    if (!lines.length) return null;
    const itemLines = lines.map(([, line], i) => {
      const unitPrice = line.sku.prices?.[currency] ?? line.sku.price ?? 0;
      const total = unitPrice * line.qty;
      const size = line.size
        ? ` — ${xaI18n.t("xaB.src.app.cart.page.whatsapp.sizeLabel")}: ${line.size}`
        : "";
      return `${i + 1}. ${line.sku.title}${size} — ${xaI18n.t("xaB.src.app.cart.page.whatsapp.qtyLabel")}: ${line.qty} — ${formatAmount(total, currency)}`;
    });
    const text = [
      xaI18n.t("xaB.src.app.cart.page.whatsapp.opening"),
      "",
      ...itemLines,
      "",
      `${xaI18n.t("xaB.src.app.cart.page.whatsapp.subtotalLabel")}: ${formatAmount(subtotal, currency)}`,
      "",
      phone.trim()
        ? `${xaI18n.t("xaB.src.app.cart.page.whatsapp.contactLabel")}: ${phone.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    return toWhatsappTextHref(siteConfig.whatsappNumber, text);
  }, [lines, currency, subtotal, phone]);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Cart</h1>
      </Section>

      <Section padding="default">
        {lines.length === 0 ? (
          <EmptyState
            className="rounded-sm border border-border-1 [&_h3]:text-xs [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-muted-foreground"
            title={xaI18n.t("xaB.src.app.cart.page.l38c42")}
            action={
              <Link
                href="/collections/all"
                className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {xaI18n.t("xaB.src.app.cart.page.l40c67")}
              </Link>
            }
          />
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
                            <div className="xa-pdp-meta text-muted-foreground">
                              Size: {line.size}
                            </div>
                          ) : null}
                          <div className="xa-pdp-meta text-muted-foreground">
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
              <Button variant="outline" onClick={() => void dispatch({ type: "clear" })}>
                Clear cart
              </Button>
            </div>

            <XaWhatsappEnquiryPanel
              title={xaI18n.t("xaB.src.app.cart.page.whatsapp.title")}
              description={xaI18n.t("xaB.src.app.cart.page.whatsapp.description")}
              phone={phone}
              phonePlaceholder={xaI18n.t("xaB.src.app.cart.page.whatsapp.phonePlaceholder")}
              buttonLabel={xaI18n.t("xaB.src.app.cart.page.whatsapp.button")}
              href={whatsappHref}
              onPhoneChange={setPhone}
            />
          </div>
        )}
      </Section>
    </main>
  );
}
