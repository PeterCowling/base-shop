// src/lib/jsonld/buildHostelSchema.ts
import { z } from "zod";

import type { HostelRoomOffer, HostelSchema, Room } from "@/types/schema";

const roomInputSchema = z.object({
  sku: z.string(),
  name: z.string(),
  description: z.string(),
  beds: z.number().int().positive(),
  images: z.string().url().array().nonempty(),
  price: z.number(),
  priceCurrency: z.string(),
  availability: z.enum(["InStock", "SoldOut"]),
  amenities: z.string().array().default([]),
});

export const hostelInputSchema = z.object({
  id: z.string().url(),
  name: z.string(),
  description: z.string(),
  aggregateRating: z.object({
    ratingValue: z.number(),
    reviewCount: z.number().int(),
  }),
  rooms: roomInputSchema.array(),
});

export type BuildHostelSchemaInput = z.infer<typeof hostelInputSchema>;

export function buildHostelSchema(data: BuildHostelSchemaInput): HostelSchema {
  const parsed = hostelInputSchema.parse(data);
  const offers: HostelRoomOffer[] = parsed.rooms.map((room) => {
    const roomObj: Room = {
      "@type": "Room",
      name: room.name,
      description: room.description,
      bed: {
        "@type": "BedDetails",
        numberOfBeds: room.beds,
      },
      amenityFeature: room.amenities.map((name) => ({
        "@type": "LocationFeatureSpecification",
        name,
        value: true,
      })),
      image: room.images,
    };

    return {
      "@type": "Offer",
      price: room.price.toFixed(2),
      priceCurrency: room.priceCurrency,
      availability: `https://schema.org/${room.availability}`,
      sku: room.sku,
      itemOffered: roomObj,
      image: room.images,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: room.price,
        priceCurrency: room.priceCurrency,
        unitCode: "NI",
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "Hostel",
    name: parsed.name,
    description: parsed.description,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: parsed.aggregateRating.ratingValue,
      reviewCount: parsed.aggregateRating.reviewCount,
    },
    makesOffer: offers,
  };
}

export default buildHostelSchema;
