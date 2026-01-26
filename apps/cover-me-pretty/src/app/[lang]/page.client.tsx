// apps/cover-me-pretty/src/app/[lang]/page.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import BlogListing, { type BlogPost } from "@acme/cms-ui/blocks/BlogListing";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/page-builder-core";
import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";
import DynamicRenderer from "@acme/ui/components/DynamicRenderer";

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
