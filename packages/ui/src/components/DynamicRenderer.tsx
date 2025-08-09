// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import {
  blockRegistry,
  ProductCarousel,
  NewsletterForm,
  PromoBanner,
  CategoryList,
  Section,
} from "@/components/cms/blocks";
import { PRODUCTS } from "@/lib/products";
import type { PageComponent, SKU } from "@types";

const registry: Record<string, React.ComponentType<any>> = {
  ...blockRegistry,
  ProductCarousel,
  NewsletterForm,
  PromoBanner,
  CategoryList,
  Section,
};

export default function DynamicRenderer({
  components,
}: {
  components: PageComponent[];
}) {
  return (
    <>
      {components.map((c) => {
        const Comp = registry[c.type];
        if (!Comp) {
          console.warn(`Unknown component type: ${c.type}`);
          return null;
        }

        const { id, type, width, height, ...props } = c as any;
        return (
          <div key={id} style={{ width, height }}>
            {type === "ProductGrid" ? (
              <Comp {...props} skus={PRODUCTS as SKU[]} />
            ) : (
              <Comp {...props} />
            )}
          </div>
        );
      })}
    </>
  );
}

