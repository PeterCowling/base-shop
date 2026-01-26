// src/types/schema.ts
/* ─────────────────────────────────────────────────────────────
   Minimal Schema-org node typings (no assumptions about
   your application-level Room shape)
---------------------------------------------------------------- */
export interface Hotel {
  "@type": "Hotel" | "Hostel";
  "@id": string;
  // Commonly used, explicitly typed fields (others remain indexable via fallback)
  image: Array<string | ImageObject>;
  mainEntityOfPage?: string;
  publisher?: { "@type": "Organization"; name: string; url: string };
  inLanguage?: string;
  isPartOf?: { "@id": string };
  /* …all other props you need, kept as `unknown` for brevity … */
  [k: string]: unknown;
}

export interface HotelRoom {
  "@type": "HotelRoom";
  "@id": string;
  name: string;
  description: string;
  occupancy: unknown;
  amenityFeature: unknown[];
  bed: number | BedDetails;
  image: string[];
}

export interface Offer {
  "@type": "Offer";
  "@id": string;
  name: string;
  description: string;
  itemOffered: { "@id": string };
  sku: string;
  price: number;
  priceSpecification: UnitPriceSpecification | unknown;
  priceCurrency: "EUR";
  availabilityStarts?: string;
  availability?: string;
  potentialAction?: ReserveAction;
  image: string[];
}

export interface HotelGraph {
  "@context": "https://schema.org";
  hotel: Hotel;
  rooms: HotelRoom[];
  offers: Offer[];
}

/* helper types for utils/schema.ts only */
export interface OfferInput {
  sku: string;
  name: string;
  description: string;
  price: number;
  validFrom?: string;
  images: string[];
}

export interface HostelRoomOffer {
  "@type": "Offer";
  price: string;
  priceCurrency: string;
  availability: string;
  sku: string;
  itemOffered: Room;
  image: string[];
  priceSpecification?: {
    "@type": "UnitPriceSpecification";
    price: number | string;
    priceCurrency: string;
    unitCode?: string;
  };
}

export interface Room {
  "@type": "Room";
  name: string;
  description: string;
  bed: BedDetails;
  amenityFeature: Array<{ "@type": "LocationFeatureSpecification"; name: string; value: true }>;
  image: string[];
}

export interface BedDetails {
  "@type": "BedDetails";
  numberOfBeds: number;
}

// Minimal ImageObject definition for JSON-LD enrichment
export interface ImageObject {
  "@type": "ImageObject";
  url: string;
  width?: number;
  height?: number;
}

export interface UnitPriceSpecification {
  "@type": "UnitPriceSpecification";
  price: number;
  priceCurrency: string;
  unitCode?: string;
  validFrom?: string;
}

export interface EntryPoint {
  "@type": "EntryPoint";
  urlTemplate: string;
  httpMethod: string;
  encodingType: string;
}

export interface ReserveAction {
  "@type": "ReserveAction";
  name: string;
  target: EntryPoint;
  result: { "@type": "LodgingReservation" };
}

export interface HostelSchema {
  "@context": "https://schema.org";
  "@type": "Hostel";
  name: string;
  description: string;
  aggregateRating: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
  makesOffer: HostelRoomOffer[];
}

export interface HostelRoomInput {
  sku: string;
  name: string;
  description: string;
  beds: number;
  images: string[];
  price: number;
  priceCurrency: string;
  availability: "InStock" | "SoldOut";
  amenities: string[];
}
