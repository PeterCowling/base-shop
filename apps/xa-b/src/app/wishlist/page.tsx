"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button, EmptyState } from "@acme/design-system/atoms";
import { Grid as LayoutGrid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

import { XaProductCard } from "../../components/XaProductCard";
import { XaWhatsappEnquiryPanel } from "../../components/XaWhatsappEnquiryPanel";
import { useWishlist } from "../../contexts/XaWishlistContext";
import { XA_PRODUCTS } from "../../lib/demoData";
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

export default function WishlistPage() {
  const [currency] = useCurrency();
  const [wishlist, dispatch] = useWishlist();
  const [phone, setPhone] = useState("");
  const products = useMemo(() => {
    const lookup = new Map(XA_PRODUCTS.map((product) => [product.id, product]));
    return wishlist.flatMap((id) => {
      const product = lookup.get(id);
      return product ? [product] : [];
    });
  }, [wishlist]);

  const whatsappHref = useMemo(() => {
    if (!products.length) return null;
    const itemLines = products.map((p, i) => {
      const price = p.prices?.[currency] ?? p.price ?? 0;
      return `${i + 1}. ${p.title} — ${formatAmount(price, currency)}`;
    });
    const text = [
      xaI18n.t("xaB.src.app.wishlist.page.whatsapp.opening"),
      "",
      ...itemLines,
      "",
      phone.trim()
        ? `${xaI18n.t("xaB.src.app.wishlist.page.whatsapp.contactLabel")}: ${phone.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    return toWhatsappTextHref(siteConfig.whatsappNumber, text);
  }, [products, currency, phone]);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Wishlist</h1>
            <div className="text-sm text-muted-foreground">
              {products.length} items
            </div>
          </div>
          {products.length ? (
            <Button variant="outline" onClick={() => dispatch({ type: "clear" })}>{xaI18n.t("xaB.src.app.wishlist.page.l35c83")}</Button>
          ) : null}
        </div>
      </Section>

      <Section padding="default">
        {products.length ? (
          <div className="space-y-6">
            <LayoutGrid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
              {products.map((product) => (
                <XaProductCard key={product.slug} product={product} />
              ))}
            </LayoutGrid>

            <XaWhatsappEnquiryPanel
              title={xaI18n.t("xaB.src.app.wishlist.page.whatsapp.title")}
              description={xaI18n.t("xaB.src.app.wishlist.page.whatsapp.description")}
              phone={phone}
              phonePlaceholder={xaI18n.t("xaB.src.app.wishlist.page.whatsapp.phonePlaceholder")}
              buttonLabel={xaI18n.t("xaB.src.app.wishlist.page.whatsapp.button")}
              href={whatsappHref}
              onPhoneChange={setPhone}
            />
          </div>
        ) : (
          <EmptyState
            className="rounded-sm border border-border-1 [&_h3]:text-xs [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-muted-foreground"
            title={xaI18n.t("xaB.src.app.wishlist.page.l51c42")}
            action={
              <Link
                href="/new-in"
                className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {xaI18n.t("xaB.src.app.wishlist.page.l53c58")}
              </Link>
            }
          />
        )}
      </Section>
    </main>
  );
}
