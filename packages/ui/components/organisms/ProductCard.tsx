import Image, { type StaticImageData } from "next/image";
import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../atoms-shadcn";
import { Price } from "../atoms/Price";

export interface Product {
  id: string;
  title: string;
  image: string | StaticImageData;
  price: number;
}

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showImage?: boolean;
  showPrice?: boolean;
  ctaLabel?: string;
}

export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      product,
      onAddToCart,
      showImage = true,
      showPrice = true,
      ctaLabel = "Add to cart",
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-3 rounded-lg border p-4", className)}
        {...props}
      >
        {showImage && (
          <div className="relative aspect-square">
            <Image
              src={product.image}
              alt={product.title}
              fill
              sizes="(min-width: 640px) 25vw, 50vw"
              className="rounded-md object-cover"
            />
          </div>
        )}
        <h3 className="font-medium">{product.title}</h3>
        {showPrice && (
          <Price amount={product.price} className="font-semibold" />
        )}
        {onAddToCart && (
          <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
        )}
      </div>
    );
  }
);
ProductCard.displayName = "ProductCard";
