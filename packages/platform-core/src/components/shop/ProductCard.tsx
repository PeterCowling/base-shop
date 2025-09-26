// src/components/shop/ProductCard.tsx
import type { SKU } from "@acme/types";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "../../contexts/CurrencyContext";
import { formatPrice } from "@acme/shared-utils";
import { memo } from "react";
import AddToCartButton from "./AddToCartButton.client";

interface PriceProps {
  amount: number;
  currency?: string;
}

export function Price({ amount, currency }: PriceProps) {
  const [ctxCurrency] = useCurrency();
  const cur = currency ?? ctxCurrency ?? "EUR";
  return <span>{formatPrice(amount, cur)}</span>;
}

function ProductCardInner({ sku }: { sku: SKU & { badges?: { sale?: boolean; new?: boolean } } }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border p-4 transition-shadow hover:shadow-md">
      {" "}
      <Link
        href={`../product/${sku.slug}`}
        className="relative block aspect-square"
      >
        {sku.media[0] && (
          sku.media[0].type === "image" ? (
            <Image
              src={sku.media[0].url}
              alt={sku.title}
              fill
              sizes="(min-width: 640px) 25vw, 50vw"
              className="rounded-md object-cover"
            />
          ) : (
            <video
              src={sku.media[0].url}
              className="h-full w-full rounded-md object-cover"
              muted
              playsInline
            />
          )
        )}
      </Link>
      {sku.badges?.sale && <span data-cy="badge-sale">Sale</span>}
      {sku.badges?.new && <span data-cy="badge-new">New</span>}
      <h3 className="font-medium">{sku.title}</h3>
      {sku.price != null && (
        <div className="font-semibold text-gray-900">
          <Price amount={sku.price} />
        </div>
      )}
      <AddToCartButton sku={sku} />
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
