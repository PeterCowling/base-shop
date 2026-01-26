 
// src/components/seo/GuideSectionsItemListStructuredData.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

import { buildCanonicalUrl } from "@acme/ui/lib/seo";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { GuideKey } from "@/routes.guides-helpers";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

type ListItem = { "@type": "ListItem"; position: number; name: string; description?: string };

interface Props {
  guideKey: GuideKey;
  name?: string;
  canonicalUrl?: string;
}

function GuideSectionsItemListStructuredData({ guideKey, name, canonicalUrl }: Props): JSX.Element | null {
  const lang = useCurrentLanguage();
  const pathname = usePathname() ?? "";
  const { t, ready } = useTranslation("guides", { lng: lang });

  const json = (() => {
    if (!ready) return "";
    // Prefer raw structured sections from the translator
    const raw = t(`content.${guideKey}.sections`, { returnObjects: true }) as unknown;
    let arr = Array.isArray(raw) ? (raw as Array<{ title?: unknown; body?: unknown }>) : [];

    let items: ListItem[] = arr.reduce((acc: ListItem[], s) => {
      const rawTitle = typeof s?.title === "string" ? s.title : String(s?.title ?? "");
      const itemName = rawTitle.trim();
      if (!itemName) return acc;
      let description: string | undefined;
      if (Array.isArray(s?.body)) {
        const first = (s.body as unknown[])
          .map((v) => (v == null ? "" : String(v)))
          .map((v) => v.trim())
          .find((v) => v.length > 0);
        description = first && first.length > 0 ? first : undefined;
      }
      const base: ListItem = { "@type": "ListItem", position: acc.length + 1, name: itemName };
      if (description) base.description = description;
      acc.push(base);
      return acc;
    }, []);

    // Fallback A: when sections are empty, try runtime guide resources
    if (items.length === 0) {
      try {
        const fromStore = getGuideResource<unknown>(lang, `content.${guideKey}.sections`);
        const fromStoreArr = Array.isArray(fromStore)
          ? (fromStore as Array<{ title?: unknown; body?: unknown }>)
          : [];
        if (fromStoreArr.length === 0 && lang !== "en") {
          const fromEn = getGuideResource<unknown>("en", `content.${guideKey}.sections`);
          arr = Array.isArray(fromEn) ? (fromEn as Array<{ title?: unknown; body?: unknown }>) : [];
        } else {
          arr = fromStoreArr;
        }
        if (arr.length > 0) {
          items = arr.reduce((acc: ListItem[], s) => {
            const rawTitle = typeof s?.title === "string" ? s.title : String(s?.title ?? "");
            const itemName = rawTitle.trim();
            if (!itemName) return acc;
            let description: string | undefined;
            if (Array.isArray(s?.body)) {
              const first = (s.body as unknown[])
                .map((v) => (v == null ? "" : String(v)))
                .map((v) => v.trim())
                .find((v) => v.length > 0);
              description = first && first.length > 0 ? first : undefined;
            }
            const base: ListItem = { "@type": "ListItem", position: acc.length + 1, name: itemName };
            if (description) base.description = description;
            acc.push(base);
            return acc;
          }, []);
        }
      } catch {
        // ignore store fallback errors; continue to schema fallback
      }
    }

    // Fallback B: when sections are still empty, attempt to build from a compact
    // schema definition under content.{guideKey}.schema with {title, description}
    if (items.length === 0) {
      try {
        const schemaRaw = t(`content.${guideKey}.schema`, { returnObjects: true }) as unknown;
        const schemaArr = Array.isArray(schemaRaw)
          ? (schemaRaw as Array<{ title?: unknown; description?: unknown }>)
          : [];
        const fromSchema: ListItem[] = [];
        for (const s of schemaArr) {
          const title = typeof s?.title === "string" ? s.title.trim() : String(s?.title ?? "").trim();
          if (!title) continue;
          const descRaw = typeof s?.description === "string" ? s.description : (s?.description as unknown);
          const description = descRaw == null ? "" : String(descRaw).trim();
          fromSchema.push({
            "@type": "ListItem",
            position: fromSchema.length + 1,
            name: title,
            // Always include description for schema fallback, even when blank,
            // to match test expectations.
            description,
          });
        }
        items = fromSchema;
      } catch {
        // ignore schema fallback errors; keep items empty
      }
    }

    if (items.length === 0) return "";

    const url =
      typeof canonicalUrl === "string" && canonicalUrl.length > 0
        ? canonicalUrl
        : buildCanonicalUrl(BASE_URL, pathname);
    const title = typeof name === "string" && name.trim().length > 0 ? name : "";

    return serializeJsonLdValue({
      "@context": "https://schema.org",
      "@type": "ItemList",
      inLanguage: lang,
      url,
      name: title,
      itemListElement: items,
    });
  })();

  if (!json) return null;

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(GuideSectionsItemListStructuredData);
