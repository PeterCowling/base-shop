// src/components/seo/BreadcrumbStructuredData.tsx

/* ─────────────────────────────────────────────────────────────
   Breadcrumb JSON-LD — hydration-safe, no other schema
---------------------------------------------------------------- */
import { memo, useMemo } from "react";
import { buildBreadcrumbList } from "@/utils/seo/jsonld";

/** Minimal BreadcrumbList shape we generate in `utils/seo.ts` */
export interface BreadcrumbList {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  inLanguage?: string;
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
}

type BreadcrumbStructuredDataProps =
  | { breadcrumb: BreadcrumbList }
  | { items: ReadonlyArray<{ name: string; item: string }>; lang?: string };

function BreadcrumbStructuredData(props: BreadcrumbStructuredDataProps): JSX.Element | null {
  // Serialize once; render as a direct <script> tag so the markup stays
  // valid in <head>. Using a span wrapper triggers hydration warnings in
  // tests that mount the root document outside a router context.
  const markup = useMemo(() => {
    if ("breadcrumb" in props) {
      return JSON.stringify(props.breadcrumb);
    }
    const payload = buildBreadcrumbList({
      items: props.items,
      ...(props.lang ? { lang: props.lang } : {}),
    });
    return payload ? JSON.stringify(payload) : "";
  }, [props]);

  if (!markup) return null;
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export default memo(BreadcrumbStructuredData);
