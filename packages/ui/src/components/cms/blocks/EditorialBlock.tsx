"use client";

import BlogListing, { type BlogPost } from "./BlogListing";
import ProductGrid from "./ProductGrid.client";
import type { SKU } from "@acme/types";

interface Props {
  post: BlogPost;
  products: SKU[];
}

export default function EditorialBlock({ post, products }: Props) {
  return (
    <section className="space-y-4">
      <BlogListing posts={[post]} />
      <ProductGrid skus={products} />
    </section>
  );
}
