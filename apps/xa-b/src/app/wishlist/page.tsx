"use client";

import { useMemo } from "react";
/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy wishlist page pending i18n overhaul */
import Link from "next/link";

import { Button } from "@acme/design-system/atoms";
import { Grid as LayoutGrid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";

import { XaProductCard } from "../../components/XaProductCard";
import { useWishlist } from "../../contexts/XaWishlistContext";
import { XA_PRODUCTS } from "../../lib/demoData";

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
            <Button variant="outline" onClick={() => dispatch({ type: "clear" })}>
              Clear wishlist
            </Button>
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
          <div className="rounded-lg border p-6">
            <div className="font-medium">Your wishlist is empty.</div>
            <div className="mt-2 text-sm text-muted-foreground">
              <Link href="/new-in" className="underline">
                Discover new arrivals
              </Link>
            </div>
          </div>
        )}
      </Section>
    </main>
  );
}
