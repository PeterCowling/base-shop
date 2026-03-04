"use client";

import { useMemo } from "react";
import Link from "next/link";

import { Button } from "@acme/design-system/atoms";
import { Grid as LayoutGrid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";

import { XaProductCard } from "../../components/XaProductCard";
import { useWishlist } from "../../contexts/XaWishlistContext";
import { XA_PRODUCTS } from "../../lib/demoData";
import { xaI18n } from "../../lib/xaI18n";

export default function WishlistPage() {
  const [wishlist, dispatch] = useWishlist();
  const products = useMemo(() => {
    const lookup = new Map(XA_PRODUCTS.map((product) => [product.id, product]));
    return wishlist.flatMap((id) => {
      const product = lookup.get(id);
      return product ? [product] : [];
    });
  }, [wishlist]);

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
          <LayoutGrid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
            {products.map((product) => (
              <XaProductCard key={product.slug} product={product} />
            ))}
          </LayoutGrid>
        ) : (
          <div className="flex flex-col items-center rounded-sm border border-border-1 px-6 py-12 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {xaI18n.t("xaB.src.app.wishlist.page.l51c42")}
            </div>
            <Link
              href="/new-in"
              className="mt-4 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              {xaI18n.t("xaB.src.app.wishlist.page.l53c58")}
            </Link>
          </div>
        )}
      </Section>
    </main>
  );
}
