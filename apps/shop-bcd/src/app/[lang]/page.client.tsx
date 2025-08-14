// apps/shop-bcd/src/app/[lang]/page.tsx
"use client";

import DynamicRenderer from "@ui/components/DynamicRenderer";
import type { PageComponent } from "@acme/types";

export default function Home({
  components,
  locale,
  runtimeData,
}: {
  components: PageComponent[];
  locale: string;
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
