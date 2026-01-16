// src/utils/schema/builders.ts
// -----------------------------------------------------------------------------
// Build page-level JSON-LD graphs from the rooms catalogue
// -----------------------------------------------------------------------------

import { CONTACT_EMAIL } from "@/config/hotel";
import { BASE_URL } from "@/config/site";
import IMAGE_MANIFEST, { type ImageMeta } from "@/data/imageManifest";
import { getRoomsCatalog, type LocalizedRoom } from "@/utils/roomsCatalog";
import type { HotelGraph, HotelRoom, Offer, OfferInput } from "@/types/schema";
import { HOTEL_ID, WEBSITE_ID, type ExtHotelNode } from "./types";

function makeImageNode(pathRel: string): string | { "@type": "ImageObject"; url: string; width?: number; height?: number } {
  const meta: ImageMeta | undefined = IMAGE_MANIFEST[pathRel];
  const url = `${BASE_URL}${pathRel}`;
  if (!meta) return url; // fallback to simple URL when dimensions are unknown
  return { "@type": "ImageObject", url, width: meta.width, height: meta.height };
}

// For Home graph, snapshots expect relative image paths for room and offer nodes
function pickRelativeImagePaths(room: LocalizedRoom): string[] {
  return Array.isArray(room.imagesRaw) ? room.imagesRaw.slice(0, 4) : [];
}

export function buildHotelNode(opts?: {
  pageUrl?: string;
  publisher?: boolean;
  lang?: string;
}): HotelGraph["hotel"] {
  let base: ExtHotelNode = {
    "@type": "Hostel",
    "@id": HOTEL_ID,
    name: "Hostel Brikette",
    description:
      "Positano's only hostel—cliff-top terraces with sweeping Amalfi Coast views, 100 m from the SITA bus stop.",
    url: BASE_URL,
    priceRange: "€55 – €300",
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Via Guglielmo Marconi 358",
      addressLocality: "Positano SA",
      postalCode: "84017",
      addressCountry: "IT",
    },
    geo: { "@type": "GeoCoordinates", latitude: 40.629634, longitude: 14.480818 },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Free Wi-Fi", value: true },
      { "@type": "LocationFeatureSpecification", name: "Air-Conditioning", value: true },
      { "@type": "LocationFeatureSpecification", name: "Panoramic Terrace", value: true },
      { "@type": "LocationFeatureSpecification", name: "Bar & Café", value: true },
      { "@type": "LocationFeatureSpecification", name: "Secure Lockers", value: true },
      {
        "@type": "LocationFeatureSpecification",
        name: "Concierge / Digital Assistant",
        value: true,
      },
      { "@type": "LocationFeatureSpecification", name: "Luggage Storage", value: true },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    checkinTime: "15:30",
    checkoutTime: "10:30",
    sameAs: [
      "https://maps.google.com/maps?cid=17733313080460471781",
      "https://maps.apple.com/?q=Hostel+Brikette&ll=40.629634,14.480818",
      "https://www.instagram.com/brikettepositano",
    ],
    // Include Google Maps CID URL as hasMap per contact policy (no telephone)
    hasMap: "https://maps.google.com/maps?cid=17733313080460471781",
    availableLanguage: ["en", "de", "es", "fr", "it", "ja", "ko", "pt", "ru", "zh"],
    image: [
      makeImageNode("/images/7/landing.webp"),
      makeImageNode("/images/10/landing.webp"),
      makeImageNode("/images/11/landing.webp"),
      makeImageNode("/images/12/landing.webp"),
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      bestRating: 10,
      ratingCount: 3336,
      ratingValue: 9.3,
      reviewCount: 3336,
      worstRating: 1,
    },
  };

  if (opts?.pageUrl) {
    base = { ...base, mainEntityOfPage: opts.pageUrl };
  }
  if (opts?.publisher) {
    base = {
      ...base,
      publisher: { "@type": "Organization", name: "Hostel Brikette", url: BASE_URL },
    };
  }
  if (opts?.lang) {
    base = { ...base, inLanguage: opts.lang };
  }
  base = { ...base, isPartOf: { "@id": WEBSITE_ID } };
  return base as HotelGraph["hotel"];
}

function buildRoom(room: LocalizedRoom): HotelRoom {
  return {
    "@type": "HotelRoom",
    "@id": `${BASE_URL}#room-${room.sku}`,
    name: room.title,
    description: room.description,
    occupancy: { "@type": "QuantitativeValue", value: room.occupancy ?? 1, unitCode: "C62" },
    amenityFeature: room.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a.name,
      value: true,
    })),
    bed: { "@type": "BedDetails", numberOfBeds: room.occupancy ?? 1 },
    image: pickRelativeImagePaths(room),
  };
}

export function buildOffer(input: OfferInput): Offer {
  return {
    "@type": "Offer",
    "@id": `${BASE_URL}#offer-${input.sku}`,
    name: input.name,
    description: input.description,
    itemOffered: { "@id": `${BASE_URL}#room-${input.sku}` },
    sku: input.sku,
    price: input.price,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: input.price,
      priceCurrency: "EUR",
      unitCode: "NI",
      validFrom: input.validFrom,
    },
    priceCurrency: "EUR",
    availabilityStarts: input.validFrom,
    availability: "https://schema.org/InStock",
    potentialAction: {
      "@type": "ReserveAction",
      name: `Reserve ${input.name}`,
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/api/quote?sku=${input.sku}&checkin={checkin}&checkout={checkout}`,
        httpMethod: "GET",
        encodingType: "application/json",
      },
      result: { "@type": "LodgingReservation" },
    },
    image: input.images.slice(0, 4),
  };
}

export function buildHomeGraph(pageUrl?: string, lang = "en"): HotelGraph {
  const hotel = buildHotelNode({
    ...(pageUrl ? { pageUrl } : {}),
    publisher: true,
    lang,
  });

  const localizedRooms = getRoomsCatalog(lang);
  const rooms = localizedRooms.map((room) => buildRoom(room));

  const offers = localizedRooms.map((room) =>
    buildOffer({
      sku: room.sku,
      name: room.title,
      description: room.description,
      price: room.basePrice.amount,
      validFrom: "2025-10-19",
      images: pickRelativeImagePaths(room),
    })
  );

  return { "@context": "https://schema.org", hotel, rooms, offers };
}
