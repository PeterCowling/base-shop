// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { Image, Text } from "@/components/cms/blocks";
import BlogListing from "@/components/cms/blocks/BlogListing";
import ContactForm from "@/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@/components/cms/blocks/ContactFormWithMap";
import Gallery from "@/components/cms/blocks/Gallery";
import ProductCarousel from "@/components/cms/blocks/ProductCarousel";
import Section from "@/components/cms/blocks/Section";
import Testimonials from "@/components/cms/blocks/Testimonials";
import TestimonialSlider from "@/components/cms/blocks/TestimonialSlider";
import { CategoryList, NewsletterForm, PromoBanner } from "@/components/cms/blocks/molecules";
import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { PRODUCTS } from "@/lib/products";
import { ProductGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { PageComponent, SKU } from "@types";

const registry: Record<PageComponent["type"], React.ComponentType<any>> = {
  Section,
  HeroBanner,
  ValueProps,
  ReviewsCarousel,
  ProductGrid,
  ProductCarousel,
  Gallery,
  ContactForm,
  ContactFormWithMap,
  BlogListing,
  NewsletterForm,
  PromoBanner,
  CategoryList,
  Testimonials,
  TestimonialSlider,
  Image,
  Text,
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

        if (type === "Section") {
          const { children = [], ...rest } = props as {
            children?: PageComponent[];
          };

          return (
            <Comp key={id} {...rest}>
              <DynamicRenderer components={children} />
            </Comp>
          );
        }

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

