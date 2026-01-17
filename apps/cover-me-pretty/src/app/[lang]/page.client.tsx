// apps/cover-me-pretty/src/app/[lang]/page.tsx
"use client";

import DynamicRenderer from "@acme/ui/components/DynamicRenderer";
import type { PageComponent } from "@acme/page-builder-core";
import BlogListing, { type BlogPost } from "@acme/ui/components/cms/blocks/BlogListing";
import type { Locale } from "@acme/i18n/locales";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

export default function Home({
  components,
  locale,
  latestPost,
}: {
  components: PageComponent[];
  locale: Locale;
  latestPost?: BlogPost;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void logAnalyticsEvent({ type: "page_view", path: pathname, locale });
  }, [pathname, locale]);

  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      <DynamicRenderer components={components} locale={locale} />
    </>
  );
}
