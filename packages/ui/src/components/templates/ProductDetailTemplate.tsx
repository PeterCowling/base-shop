import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";
import type { Product } from "../organisms/ProductCard";

export interface ProductDetailTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: Product & {
    description?: string;
    badges?: { label: string; variant?: "default" | "sale" | "new" }[];
  };
  onAddToCart?: (product: Product) => void;
  ctaLabel?: string;
}

export function ProductDetailTemplate({
  product,
  onAddToCart,
  ctaLabel = "Add to cart",
  className,
  ...props
}: ProductDetailTemplateProps) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)} {...props}>
      <div className="relative aspect-square w-full">
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="rounded-md object-cover"
        />
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">{product.title}</h2>
        {product.badges && (
          <div className="flex gap-2">
            {product.badges.map((b, idx) => (
              <ProductBadge key={idx} label={b.label} variant={b.variant} />
            ))}
          </div>
        )}
        <Price amount={product.price} className="text-xl font-bold" />
        {product.description && <p>{product.description}</p>}
        {onAddToCart && (
          <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
        )}
      </div>
    </div>
  );
}
