// apps/shop-abc/src/app/[[...lang]]/page.tsx
"use client";

import DynamicRenderer from "@ui/components/DynamicRenderer";
import type { PageComponent } from "@acme/types";
import type { Locale } from "@/i18n/locales";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import EditorialBlock from "@ui/components/cms/blocks/EditorialBlock";
import type { SKU } from "@acme/types";

export default function Home({
  components,
  locale,
  latestPost,
  editorialBlocks,
}: {
  components: PageComponent[];
  locale: Locale;
  latestPost?: BlogPost;
  editorialBlocks?: { post: BlogPost; products: SKU[] }[];
}) {
  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      {editorialBlocks?.map((b, i) => (
        <EditorialBlock key={i} post={b.post} products={b.products} />
      ))}
      <DynamicRenderer components={components} locale={locale} />
    </>
  );
}
