// apps/shop-abc/src/app/[[...lang]]/page.tsx
"use client";

import DynamicRenderer from "@ui/components/DynamicRenderer";
import type { PageComponent } from "@acme/types";
import type { Locale } from "@/i18n/locales";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";

export default function Home({
  components,
  locale,
  latestPost,
}: {
  components: PageComponent[];
  locale: Locale;
  latestPost?: BlogPost;
}) {
  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      <DynamicRenderer components={components} locale={locale} />
    </>
  );
}
