/* ────────────────────────────────────────────────────────────────
   src/components/seo/DealsStructuredData.tsx
   JSON-LD for the current deal (Google travel carousel)
---------------------------------------------------------------- */
import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { DEALS } from "@/routes/deals/deals";
import { getDealStatus } from "@/routes/deals/status";
import { getSlug } from "@/utils/slug";
import { memo, useMemo } from "react";

function DealsStructuredData(): JSX.Element | null {
  const lang = useCurrentLanguage();
  const pageUrl = `${BASE_URL}/${lang}/${getSlug("deals", lang)}`;
  const now = useMemo(() => new Date(), []);
  const currentDeal = useMemo(() => {
    return DEALS.find((deal) => getDealStatus(deal, now) !== "expired") ?? null;
  }, [now]);

  const jsonLd = useMemo(() => {
    if (!currentDeal) return null;
    /* ── constants reused across locales ───────────────────────── */
    const availabilityStarts = currentDeal.startDate;
    const availabilityEnds = currentDeal.endDate;
    const discountPct = currentDeal.discountPct;

    const formatIsoDate = (value: string): string => {
      try {
        // Force local midnight to avoid TZ shifts when parsing YYYY-MM-DD.
        const date = new Date(`${value}T00:00:00`);
        return new Intl.DateTimeFormat(lang, { month: "short", day: "numeric", year: "numeric" }).format(date);
      } catch {
        return value;
      }
    };
    const formattedStart = formatIsoDate(availabilityStarts);
    const formattedEnd = formatIsoDate(availabilityEnds);

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
            name: `Hostel Brikette – Save ${discountPct} % when you book direct`,
            description:
              `Save ${discountPct} % on direct bookings. Discount is auto‑applied at checkout. Valid ${formattedStart} – ${formattedEnd}.`,
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
  }, [currentDeal, lang, pageUrl]);

  if (!jsonLd) return null;

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}

export default memo(DealsStructuredData);
