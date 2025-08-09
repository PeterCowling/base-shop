// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { Image, Text } from "@/components/cms/blocks";
import BlogListing from "@/components/cms/blocks/BlogListing";
import ContactForm from "@/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@/components/cms/blocks/ContactFormWithMap";
import Gallery from "@/components/cms/blocks/Gallery";
import Testimonials from "@/components/cms/blocks/Testimonials";
import TestimonialSlider from "@/components/cms/blocks/TestimonialSlider";
import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { PRODUCTS } from "@/lib/products";
import { ProductGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { PageComponent, SKU } from "@types";
import type { Locale } from "@i18n/locales";

const registry: Record<PageComponent["type"], React.ComponentType<any>> = {
  HeroBanner,
  ValueProps,
  ReviewsCarousel,
  ProductGrid,
  Gallery,
  ContactForm,
  ContactFormWithMap,
  BlogListing,
  Testimonials,
  TestimonialSlider,
  Image,
  Text,
};

export default function DynamicRenderer({
  components,
  locale = "en",
}: {
  components: PageComponent[];
  locale?: Locale;
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
              <Comp {...props} skus={PRODUCTS as SKU[]} locale={locale} />
            ) : (
              <Comp {...props} locale={locale} />
            )}
          </div>
        );
      })}
    </>
  );
}

