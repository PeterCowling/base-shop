/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/RoomStructuredData.tsx
import { BASE_URL } from "@/config/site";
import type { Room as DataRoom } from "@/data/roomsData";
import { buildOffer } from "@/utils/schema";
import { getRoomsCatalog, resolveFallbackLanguage, type LocalizedRoom } from "@/utils/roomsCatalog";
import { memo, useMemo } from "react";

function pickImages(room: DataRoom): string[] {
  return Array.isArray(room.imagesRaw) ? room.imagesRaw.slice(0, 4).map((u) => `${BASE_URL}${u}`) : [];
}

interface Props {
  room: DataRoom;
  lang?: string;
}

function RoomStructuredData({ room, lang }: Props): JSX.Element {
  const locale = lang ?? "en";
  const json = useMemo(() => {
    const roomId = `${BASE_URL}#room-${room.id}`;

    const fallbackLanguage = resolveFallbackLanguage();
    const localizedRooms = getRoomsCatalog(locale, { fallbackLang: fallbackLanguage });
    let localized = localizedRooms.find((entry) => entry.id === room.id);
    if (!localized) {
      if (fallbackLanguage && fallbackLanguage !== locale) {
        localized = getRoomsCatalog(fallbackLanguage).find((entry) => entry.id === room.id);
      }
    }

    const localizedRoom: LocalizedRoom =
      localized ??
      ({
        ...room,
        title: room.id,
        description: room.id,
        intro: "",
        facilityKeys: [],
        amenities: [],
      } as LocalizedRoom);

    const hotelRoom = {
      "@type": "HotelRoom",
      "@id": roomId,
      name: localizedRoom.title,
      description: localizedRoom.description,
      occupancy: { "@type": "QuantitativeValue", value: room.occupancy ?? 1, unitCode: "C62" },
      amenityFeature: localizedRoom.amenities.map((a) => ({
        "@type": "LocationFeatureSpecification",
        name: a.name,
        value: true,
      })),
      bed: room.occupancy ?? 1,
      image: pickImages(room),
    };

    const offer = buildOffer({
      sku: room.id,
      name: localizedRoom.title,
      description: localizedRoom.description,
      price: room.basePrice.amount,
      validFrom: new Date().toISOString().slice(0, 10),
      images: pickImages(room),
    });

    return JSON.stringify({ "@context": "https://schema.org", "@graph": [hotelRoom, offer] });
  }, [locale, room]);

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(RoomStructuredData);

