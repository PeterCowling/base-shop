// apps/shop-abc/src/app/[[...lang]]/page.tsx
"use client";

import DynamicRenderer from "@ui/components/DynamicRenderer";
import type { PageComponent } from "@types";
import type { Locale } from "@i18n/locales";

export default function Home({
  components,
  locale,
}: {
  components: PageComponent[];
  locale: Locale;
}) {
  return <DynamicRenderer components={components} locale={locale} />;
}
