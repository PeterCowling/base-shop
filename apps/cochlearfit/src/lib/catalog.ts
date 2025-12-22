import type { Product, ProductColor, ProductSize, ProductVariant } from "@/types/product";
import { colors, products, sizes } from "@/data/products";

export function getProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getVariantById(variantId: string): ProductVariant | undefined {
  for (const product of products) {
    const match = product.variants.find((variant) => variant.id === variantId);
    if (match) return match;
  }
  return undefined;
}

export function getVariantBySelection(
  product: Product,
  size: ProductSize,
  color: ProductColor
): ProductVariant | undefined {
  return product.variants.find(
    (variant) => variant.size === size && variant.color === color
  );
}

export function getDefaultVariant(product: Product): ProductVariant {
  const fallback = product.variants[0];
  if (!fallback) {
    // i18n-exempt -- CF-1005 dev-only error message [ttl=2026-12-31]
    throw new Error("Product has no variants");
  }
  return product.variants.find((variant) => variant.inStock) ?? fallback;
}

export function getAvailableSizes(product: Product): ProductSize[] {
  const unique = new Set<ProductSize>();
  for (const variant of product.variants) {
    unique.add(variant.size);
  }
  return sizes.map((size) => size.key).filter((size) => unique.has(size));
}

export function getAvailableColors(product: Product): ProductColor[] {
  const unique = new Set<ProductColor>();
  for (const variant of product.variants) {
    unique.add(variant.color);
  }
  return colors.map((color) => color.key).filter((color) => unique.has(color));
}

export function getColorHex(color: ProductColor): string {
  return colors.find((entry) => entry.key === color)?.hex ?? "hsl(var(--color-fg))";
}
