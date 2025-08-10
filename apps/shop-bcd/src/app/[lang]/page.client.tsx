// apps/shop-bcd/src/app/[lang]/page.tsx
"use client";

import DynamicRenderer from "@ui";
import type { PageComponent } from "@types";

export default function Home({
  components,
  locale,
}: {
  components: PageComponent[];
  locale: string;
}) {
  return <DynamicRenderer components={components} locale={locale} />;
}
