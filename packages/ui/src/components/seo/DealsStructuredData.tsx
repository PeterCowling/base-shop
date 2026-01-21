/* ────────────────────────────────────────────────────────────────
   src/components/seo/DealsStructuredData.tsx
   JSON-LD for Summer-2025 −15 % coupon – Google travel carousel
---------------------------------------------------------------- */
import { memo, useMemo } from "react";

import { BASE_URL } from "../../config/site";
import { useCurrentLanguage } from "../../hooks/useCurrentLanguage";
import { getSlug } from "../../utils/slug";

function DealsStructuredData(): JSX.Element {
  const lang = useCurrentLanguage();
  const pageUrl = `${BASE_URL}/${lang}/${getSlug("deals", lang)}`;
  const jsonLd = useMemo(() => {
    /* ── constants reused across locales ───────────────────────── */
    const availabilityStarts = "2025-05-29";
    const availabilityEnds = "2025-10-31";
    const discountPct = 15;

    /* ── ItemList → ListItem → Hotel hierarchy (carousel spec) ── */
    const data = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${pageUrl}#deals`,
      url: pageUrl,
      inLanguage: lang,
      isPartOf: { "@id": `${BASE_URL}#website` },
      mainEntityOfPage: pageUrl,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "Hotel",
            name: `Hostel Brikette – Summer 2025 deal (-${discountPct} %)` /* i18n-exempt -- SEO-2025 JSON-LD metadata copy [ttl=2026-06-30] */,
            description:
              "Save an extra 15 % when you reserve direct. Discount is auto‑applied on our site. Valid 29 May – 31 Oct 2025." /* i18n-exempt -- SEO-2025 JSON-LD metadata copy [ttl=2026-06-30] */,
            image: [
              `${BASE_URL}/images/16x9/hero.jpg`,
              `${BASE_URL}/images/4x3/hero.jpg`,
              `${BASE_URL}/images/1x1/hero.jpg`,
            ],
            url: pageUrl,
            priceRange: "€55-€500",
            availabilityStarts,
            availabilityEnds,
            offers: {
              "@type": "Offer",
              category: "SpecialOffer",
              url: pageUrl,
              validFrom: availabilityStarts,
              validThrough: availabilityEnds,
              availabilityStarts,
              availabilityEnds,
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock"
            },
          },
        },
      ],
    };

    return JSON.stringify(data);
  }, [lang, pageUrl]);

  return (
    <script
      type={
        "application/ld+json" /* i18n-exempt -- SEO-2025 JSON-LD mime type [ttl=2026-06-30] */
      }
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}

export default memo(DealsStructuredData);
