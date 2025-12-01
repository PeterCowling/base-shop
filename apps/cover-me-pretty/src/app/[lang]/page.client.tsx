// apps/cover-me-pretty/src/app/[lang]/page.tsx
"use client";

import DynamicRenderer from "@ui/components/DynamicRenderer";
import type { PageComponent } from "@acme/page-builder-core";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import type { Locale } from "@i18n/locales";

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
