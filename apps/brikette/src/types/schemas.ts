// src/types/schemas.ts
import { z } from "zod";

/** Params coming from the route `/users/:userId` */
export const userParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

/** Search-string query parameters for the Users page */
export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  sort: z.enum(["asc", "desc"]).default("asc"),
});

/** Example form payload for creating a user */
export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

/** Re-export the inferred static types */
export type UserParams = z.infer<typeof userParamsSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
export type CreateUser = z.infer<typeof createUserSchema>;

/* -------------------------------------------------------------------------- */
/* Config object schemas                                                       */
/* -------------------------------------------------------------------------- */

/** Localised string with one entry per supported language */
export const localizedStringSchema = z
  .object({
    en: z.string(),
    de: z.string(),
    es: z.string(),
    fr: z.string(),
    it: z.string(),
    ja: z.string(),
    ko: z.string(),
    pt: z.string(),
    ru: z.string(),
    zh: z.string(),
  })
  // Allow additional language keys without making them required.
  // This keeps strict typing for core locales while letting the
  // schema accept newly added languages in `i18n.config.ts`.
  .catchall(z.string());

export const amenitySchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
});

export const addressSchema = z.object({
  streetAddress: z.string(),
  addressLocality: z.string(),
  postalCode: z.string(),
  addressCountry: z.string(),
});

export const geoSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const openingHoursSchema = z.object({
  dayRange: z.string(),
  opens: z.string(),
  closes: z.string(),
});

export const ratingSourceSchema = z.object({
  provider: z.string(),
  value: z.number(),
  count: z.number(),
  best: z.number().optional(),
  worst: z.number().optional(),
});

export const hotelSchema = z.object({
  id: z.string(),
  name: localizedStringSchema,
  description: localizedStringSchema,
  url: z.string(),
  telephone: z.string().optional(),
  email: z.string(),
  address: addressSchema,
  geo: geoSchema,
  amenities: amenitySchema.array(),
  openingHours: openingHoursSchema.array(),
  checkin: z.object({ from: z.string(), until: z.string() }).optional(),
  checkout: z.object({ by: z.string() }).optional(),
  acceptedPayments: z.string().array().optional(),
  sameAs: z.string().array(),
  priceRange: z.string(),
  ratings: ratingSourceSchema.array().optional(),
});

export const moneySchema = z.object({
  amount: z.number(),
  currency: z.string(),
});

export const seasonalPriceSchema = z.object({
  season: z.enum(["low", "shoulder", "high", "event"]),
  start: z.string(),
  end: z.string(),
  price: moneySchema,
});

export const roomAmenitySchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  paid: z.boolean().optional(),
});

export const availabilitySchema = z.object({
  totalBeds: z.number(),
  defaultRelease: z.number(),
});

export const imageSetSchema = z.object({
  url: z.string(),
  alt: localizedStringSchema,
});

export const roomCategorySchema = z.object({
  sku: z.string(),
  name: localizedStringSchema,
  description: localizedStringSchema,
  occupancy: z.number(),
  pricingModel: z.enum(["perBed", "perRoom"]),
  basePrice: moneySchema,
  seasonalPrices: seasonalPriceSchema.array().optional(),
  amenities: roomAmenitySchema.array(),
  availability: availabilitySchema,
  images: imageSetSchema.array(),
});

export type HotelConfig = z.infer<typeof hotelSchema>;
export type RoomCategoryConfig = z.infer<typeof roomCategorySchema>;
