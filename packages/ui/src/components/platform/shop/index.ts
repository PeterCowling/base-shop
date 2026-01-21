/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] module specifiers are not user-facing copy */
import type { ComponentProps } from "react";

type AddToCartButtonComponent = typeof import("@acme/platform-core/components/shop/AddToCartButton.client").default;
type PlatformProductCard = typeof import("@acme/platform-core/components/shop/ProductCard").ProductCard;
type PlatformProductGrid = typeof import("@acme/platform-core/components/shop/ProductGrid").ProductGrid;
export { default as AddToCartButton } from "@acme/platform-core/components/shop/AddToCartButton.client";
export type AddToCartButtonProps = ComponentProps<AddToCartButtonComponent>;

export { Price,ProductCard } from "@acme/platform-core/components/shop/ProductCard";
export type ProductCardProps = ComponentProps<PlatformProductCard>;

export { ProductGrid } from "@acme/platform-core/components/shop/ProductGrid";
export type ProductGridProps = ComponentProps<PlatformProductGrid>;

export type {
  FilterBarProps,
  FilterDefinition,
  Filters,
} from "@acme/platform-core/components/shop/FilterBar";
export { default as FilterBar } from "@acme/platform-core/components/shop/FilterBar";
