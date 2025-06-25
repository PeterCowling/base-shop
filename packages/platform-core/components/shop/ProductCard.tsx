// src/components/shop/ProductCard.tsx
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import type { SKU } from "../../products";
import AddToCartButton from "./AddToCartButton";

function ProductCardInner({ sku }: { sku: SKU }) {
  return (
    <article className="border rounded-lg p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <Link
        href={`../product/${sku.slug}`}
        className="block relative aspect-square"
      >
        <Image
          src={sku.image}
          alt={sku.title}
          fill
          sizes="(min-width: 640px) 25vw, 50vw"
          className="object-cover rounded-md"
        />
      </Link>

      <h3 className="font-medium">{sku.title}</h3>
      <div className="font-semibold text-gray-900">€{sku.price}</div>

      <AddToCartButton sku={sku} />
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
