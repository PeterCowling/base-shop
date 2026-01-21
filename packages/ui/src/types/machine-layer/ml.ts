// src/types/machine-layer/ml.ts
// ─────────────────────────────────────────────────────────────
import type { SupportedLanguage } from "../../config";

export type LanguageCode = SupportedLanguage;

export type LocalizedString = Record<LanguageCode, string>;

/* ── shared structs ───────────────────────────────────────── */
export interface Address {
  streetAddress: string;
  addressLocality: string;
  postalCode: string;
  addressCountry: string;
}
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface Amenity {
  name: string;
  icon?: string;
}

export interface OpeningHours {
  dayRange: string; // “Mon-Sun”, “Mon-Fri”, etc.
  opens: string; // 24-h, “HH:MM”
  closes: string; // 24-h, “HH:MM”
}

export interface RatingSource {
  provider: string;
  value: number;
  count: number;
  best?: number;
  worst?: number;
}

/* ── Hotel object used across the app ─────────────────────── */
export interface Hotel {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  url: string;
  telephone?: string;
  email: string;
  address: Address;
  geo: GeoCoordinates;
  amenities: Amenity[];
  openingHours: OpeningHours[];
  checkin?: { from: string; until: string };
  checkout?: { by: string };
  /** What guests can pay with at reception (free-text, keeps it simple) */
  acceptedPayments?: string[];
  sameAs: string[];
  priceRange: string;
  ratings?: RatingSource[];
}

/* ─────────────── Rooms & commerce ─────────────── */
export interface Money {
  amount: number;
  currency: string;
}
export interface SeasonalPrice {
  season: "low" | "shoulder" | "high" | "event";
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  price: Money;
}
export interface RoomAmenity {
  name: string;
  icon?: string;
  paid?: boolean;
}
export interface Availability {
  totalBeds: number;
  defaultRelease: number;
}
export interface ImageSet {
  url: string;
  alt: LocalizedString;
}
export interface RoomCategory {
  sku: string;
  name: LocalizedString;
  description: LocalizedString;
  occupancy: number;
  pricingModel: "perBed" | "perRoom";
  basePrice: Money;
  seasonalPrices?: SeasonalPrice[];
  amenities: RoomAmenity[];
  availability: Availability;
  images: ImageSet[];
}

/* ── FAQ entries ─────────────────────────────────────────── */
export interface FAQEntry {
  id: string;
  q: LocalizedString;
  a: LocalizedString;
}
