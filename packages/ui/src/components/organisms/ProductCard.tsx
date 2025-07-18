import Image, { type StaticImageData } from "next/image";
import * as React from "react";
import { boxProps } from "../../utils/boxProps";
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
  /** Override default padding classes. */
  padding?: string;
  /** Optional width */
  width?: string | number;
  /** Optional height */
  height?: string | number;
  /** Optional margin classes */
  margin?: string;
}

export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      product,
      onAddToCart,
      showImage = true,
      showPrice = true,
      ctaLabel = "Add to cart",
      padding = "p-4",
      width,
      height,
      margin,
      className,
      ...props
    },
    ref
  ) => {
    const { classes, style } = boxProps({ width, height, padding, margin });
    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          "flex flex-col gap-3 rounded-lg border",
          classes,
          className
        )}
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
