// apps/shop-abc/src/app/[[...lang]]/page.tsx
"use client";

import DynamicRenderer from "@ui/components/DynamicRenderer";
import type { PageComponent } from "@acme/types";
import type { Locale } from "@/i18n/locales";

export default function Home({
  components,
  locale,
  runtimeData,
}: {
  components: PageComponent[];
  locale: Locale;
  runtimeData?: Record<string, Record<string, unknown>>;
}) {
  return (
    <DynamicRenderer
      components={components}
      locale={locale}
      runtimeData={runtimeData}
    />
  );
}
