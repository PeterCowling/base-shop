import {
  ProductCarousel as BaseCarousel,
  type ProductCarouselProps as BaseProps,
} from "../../organisms/ProductCarousel";
import { PRODUCTS } from "@platform-core/src/products";
import type { SKU } from "@acme/types";
import { useEffect, useState } from "react";
import { Product } from "../../organisms/ProductCard";
import { fetchCollection } from "./products/fetchCollection";

export interface CmsProductCarouselProps
  extends Omit<BaseProps, "products"> {
  skus?: SKU[];
  collectionId?: string;
}

export function getRuntimeProps() {
  const products: Product[] = PRODUCTS.map(({ id, title, image, price }) => ({
    id,
    title,
    image,
    price,
  }));
  return { products };
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
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (collectionId) {
        const fetched = await fetchCollection(collectionId);
        if (!cancelled)
          setProducts(
            fetched.map(({ id, title, image, price }) => ({
              id,
              title,
              image,
              price,
            }))
          );
      } else if (skus) {
        setProducts(
          skus.map(({ id, title, image, price }) => ({
            id,
            title,
            image,
            price,
          }))
        );
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
