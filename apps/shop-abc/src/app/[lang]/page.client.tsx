// apps/shop-abc/src/app/[[...lang]]/page.tsx
"use client";

import DynamicRenderer from "@ui/components/DynamicRenderer";
import type { PageComponent } from "@types";
import { resolveLocale } from "@i18n/locales";
import { useParams } from "next/navigation";

export default function Home({
  components,
}: {
  components: PageComponent[];
}) {
  const { lang } = useParams<{ lang: string }>();
  const locale = resolveLocale(lang);
  return <DynamicRenderer components={components} locale={locale} />;
}
