"use client";

import { useCallback, useMemo, useState } from "react";

import {
  getAvailableColors,
  getAvailableSizes,
  getDefaultVariant,
  getVariantBySelection,
} from "@/lib/catalog";
import type { Product, ProductColor, ProductSize, ProductVariant } from "@/types/product";

export function useVariantSelection(product: Product, initialVariantId?: string) {
  const defaultVariant = useMemo<ProductVariant>(() => {
    if (initialVariantId) {
      const match = product.variants.find((variant) => variant.id === initialVariantId);
      if (match) return match;
    }
    return getDefaultVariant(product);
  }, [initialVariantId, product]);

  const [size, setSize] = useState<ProductSize>(defaultVariant.size);
  const [color, setColor] = useState<ProductColor>(defaultVariant.color);

  const sizes = useMemo(() => getAvailableSizes(product), [product]);
  const colors = useMemo(() => getAvailableColors(product), [product]);

  const selectedVariant = useMemo(() => {
    return getVariantBySelection(product, size, color) ?? defaultVariant;
  }, [color, defaultVariant, product, size]);

  const onSizeChange = useCallback((nextSize: ProductSize) => {
    setSize(nextSize);
  }, []);

  const onColorChange = useCallback((nextColor: ProductColor) => {
    setColor(nextColor);
  }, []);

  return {
    sizes,
    colors,
    size,
    color,
    selectedVariant,
    onSizeChange,
    onColorChange,
  };
}
