import type { ComponentProps } from "react";
import type AddToCartButtonComponent from "@acme/platform-core/components/shop/AddToCartButton.client";
import type { ProductCard as PlatformProductCard } from "@acme/platform-core/components/shop/ProductCard";
import type { ProductGrid as PlatformProductGrid } from "@acme/platform-core/components/shop/ProductGrid";
export { default as AddToCartButton } from "@acme/platform-core/components/shop/AddToCartButton.client";
export type AddToCartButtonProps = ComponentProps<AddToCartButtonComponent>;

export { ProductCard, Price } from "@acme/platform-core/components/shop/ProductCard";
export type ProductCardProps = ComponentProps<PlatformProductCard>;

export { ProductGrid } from "@acme/platform-core/components/shop/ProductGrid";
export type ProductGridProps = ComponentProps<PlatformProductGrid>;

export { default as FilterBar } from "@acme/platform-core/components/shop/FilterBar";
export type {
  FilterBarProps,
  Filters,
  FilterDefinition,
} from "@acme/platform-core/components/shop/FilterBar";
