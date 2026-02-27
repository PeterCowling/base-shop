// src/components/seo/RoomsStructuredDataRsc.tsx
import "server-only";

import { BASE_URL } from "@/config/site";
import { toFlatImageArray } from "@/data/roomsData";
/* ─────────────────────────────────────────────────────────────
   RoomsStructuredDataRsc
   -------------------------------------------------------------
   Server-only RSC variant of RoomsStructuredData.
   Emits an <OfferCatalog> that lists every room/offer we sell
   directly in the initial HTML response — no hydration required.
   JSON-LD is therefore visible to crawlers on the first request.
---------------------------------------------------------------- */
import type { AppLanguage } from "@/i18n.config";
import type { LocalizedRoom } from "@/rooms/types";
import { loadRoomsCatalog } from "@/utils/roomsCatalog";
import { buildOffer } from "@/utils/schema/builders";
import { WEBSITE_ID } from "@/utils/schema/types";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";
import { getSlug } from "@/utils/slug";

/** Constant slug used to build the @id for every offer. */
const OFFER_PREFIX = `${BASE_URL}#offer-`;
const ROOM_PREFIX = `${BASE_URL}#room-`;
const CATALOG_ID = `${BASE_URL}#rooms-catalog`;

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
const resolveValidFrom = (room: LocalizedRoom): string | undefined => {
  const seasonalStarts = room.seasonalPrices
    ?.map((entry) => entry?.start)
    .filter(isIsoDate)
    .sort();

  if (seasonalStarts && seasonalStarts.length > 0) {
    return seasonalStarts[0] ?? undefined;
  }

  return undefined;
};

interface RoomsStructuredDataRscProps {
  lang: AppLanguage;
}

export default async function RoomsStructuredDataRsc({
  lang,
}: RoomsStructuredDataRscProps): Promise<JSX.Element> {
  const localizedRooms = await loadRoomsCatalog(lang);
  const pageUrl = `${BASE_URL}/${lang}/${getSlug("rooms", lang)}`;

  const offerNodes = localizedRooms.map((room) => {
    const offer = buildOffer({
      sku: room.sku,
      name: room.title,
      description: room.description,
      price: room.basePrice.amount,
      validFrom: resolveValidFrom(room),
      images: toAbsoluteImages(toFlatImageArray(room.images)),
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
    image: toAbsoluteImages(toFlatImageArray(room.images)),
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

  const json = serializeJsonLdValue({
    "@context": "https://schema.org",
    "@graph": [catalog, ...roomNodes, ...offerNodes],
  });

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
