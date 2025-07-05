// src/components/shop/ProductCard.tsx
import type { SKU } from "@types";
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import AddToCartButton from "./AddToCartButton.client";

function ProductCardInner({ sku }: { sku: SKU }) {
  return (
    <article className="flex flex-col gap-[var(--space-3)] rounded-lg border p-[var(--space-4)] transition-shadow hover:shadow-md">
      {" "}
      <Link
        href={`../product/${sku.slug}`}
        className="relative block aspect-square"
      >
        <Image
          src={sku.image}
          alt={sku.title}
          fill
          sizes="(min-width: 640px) 25vw, 50vw"
          className="rounded-md object-cover"
        />
      </Link>
      <h3 className="font-medium">{sku.title}</h3>
      <div className="font-semibold text-gray-900">€{sku.price}</div>
      <AddToCartButton sku={sku} />
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
