// src/components/seo/RoomsStructuredData.tsx

/* ─────────────────────────────────────────────────────────────
   RoomsStructuredData
   -------------------------------------------------------------
   Emits an <OfferCatalog> that lists every room/offer we sell.
   Each list-item references an @id that’s defined in the big
   hotel graph on the home page, so search-engines can join the
   dots without us re-serialising 100-plus KB of data.
---------------------------------------------------------------- */

import { memo, useMemo } from "react";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { getSlug } from "@/utils/slug";
import { getRoomsCatalog, resolveFallbackLanguage } from "@/utils/roomsCatalog";
import type { LocalizedRoom } from "@/rooms/types";
import { buildOffer } from "@/utils/schema/builders";
import { WEBSITE_ID } from "@/utils/schema/types";

/** Constant slug used to build the @id for every offer. */
const OFFER_PREFIX = `${BASE_URL}#offer-`;
const ROOM_PREFIX = `${BASE_URL}#room-`;
const CATALOG_ID = `${BASE_URL}#rooms-catalog`;
/**
 * Fixed fallback date for offers without seasonal windows. Keeping it static
 * avoids hydration mismatches between the server and client renders.
 */
const FALLBACK_VALID_FROM = "2025-01-01";

function toAbsoluteImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .slice(0, 4)
    .map((src) => `${BASE_URL}${src}`);
}

const isIsoDate = (input: unknown): input is string =>
  typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(input);

/**
 * Use the earliest known seasonal start date to make the offer window explicit
 * without depending on the runtime clock.
 */
const resolveValidFrom = (room: LocalizedRoom): string => {
  const seasonalStarts = room.seasonalPrices
    ?.map((entry) => entry?.start)
    .filter(isIsoDate)
    .sort();

  if (seasonalStarts && seasonalStarts.length > 0) {
    return seasonalStarts[0] ?? FALLBACK_VALID_FROM;
  }

  return FALLBACK_VALID_FROM;
};

function RoomsStructuredData(): JSX.Element {
  /* Build the JSON only once per render to avoid extra work */
  const lang = useCurrentLanguage();
  const pageUrl = `${BASE_URL}/${lang}/${getSlug("rooms", lang)}`;
  const json = useMemo(() => {
    const fallbackLang = resolveFallbackLanguage();
    const localizedRooms = getRoomsCatalog(lang, { fallbackLang });
    const offerNodes = localizedRooms.map((room) => {
      const offer = buildOffer({
        sku: room.sku,
        name: room.title,
        description: room.description,
        price: room.basePrice.amount,
        validFrom: resolveValidFrom(room),
        images: toAbsoluteImages(room.imagesRaw),
      });
      return { ...offer, inLanguage: lang };
    });

    const roomNodes = localizedRooms.map((room) => ({
      "@type": "HotelRoom",
      "@id": `${ROOM_PREFIX}${room.sku}`,
      inLanguage: lang,
      name: room.title,
      description: room.description,
      occupancy: { "@type": "QuantitativeValue", value: room.occupancy ?? 1, unitCode: "C62" },
      amenityFeature: room.amenities.map((amenity) => ({
        "@type": "LocationFeatureSpecification",
        name: amenity.name,
        value: true,
      })),
      bed: { "@type": "BedDetails", numberOfBeds: room.occupancy ?? 1 },
      image: toAbsoluteImages(room.imagesRaw),
    }));

    const catalog = {
      "@type": "OfferCatalog",
      "@id": CATALOG_ID,
      inLanguage: lang,
      url: pageUrl,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntityOfPage: pageUrl,
      name: "Rooms & Rates",
      numberOfItems: offerNodes.length,
      itemListElement: offerNodes.map((offer, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: { "@id": offer["@id"] ?? `${OFFER_PREFIX}${localizedRooms[index]?.sku}` },
      })),
    };

    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [catalog, ...roomNodes, ...offerNodes],
    });
  }, [lang, pageUrl]);

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(RoomsStructuredData);
