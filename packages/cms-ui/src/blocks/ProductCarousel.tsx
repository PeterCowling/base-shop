"use client";

import { useEffect, useState } from "react";

import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

import {
  ProductCarousel as BaseCarousel,
  type ProductCarouselProps as BaseProps,
} from "../../organisms/ProductCarousel";

import { fetchCollection } from "./products/fetchCollection";

export interface CmsProductCarouselProps
  extends Omit<BaseProps, "products"> {
  skus?: SKU[];
  collectionId?: string;
}

export function getRuntimeProps() {
  return { products: PRODUCTS as SKU[] };
}

export default function CmsProductCarousel({
  skus,
  collectionId,
  minItems,
  maxItems,
  desktopItems,
  tabletItems,
  mobileItems,
  ...rest
}: CmsProductCarouselProps) {
  const [products, setProducts] = useState<SKU[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (collectionId) {
        const fetched = await fetchCollection(collectionId);
        if (!cancelled) setProducts(fetched);
      } else if (skus) {
        setProducts(skus);
      } else {
        setProducts([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [collectionId, skus]);

  return (
    <BaseCarousel
      products={products}
      minItems={minItems}
      maxItems={maxItems}
      desktopItems={desktopItems}
      tabletItems={tabletItems}
      mobileItems={mobileItems}
      {...rest}
    />
  );
}
