import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import buildHostelSchema, {
  hostelInputSchema,
  type BuildHostelSchemaInput,
} from "@/lib/buildHostelSchema";

const validInput: BuildHostelSchemaInput = {
  id: "https://example.com/#hostel",
  name: "Example Hostel",
  description: "A test hostel",
  aggregateRating: { ratingValue: 4.8, reviewCount: 12 },
  rooms: [
    {
      sku: "dorm-4",
      name: "4 bed dorm",
      description: "A comfy dorm",
      beds: 4,
      images: ["https://example.com/img1.jpg"],
      price: 30,
      priceCurrency: "EUR",
      availability: "InStock",
      amenities: ["WiFi", "Lockers"],
    },
    {
      sku: "priv-1",
      name: "Private room",
      description: "A private room",
      beds: 1,
      images: ["https://example.com/img2.jpg"],
      price: 80,
      priceCurrency: "EUR",
      availability: "SoldOut",
      amenities: [],
    },
  ],
};

const expectedHostel = {
  "@context": "https://schema.org",
  "@type": "Hostel",
  name: validInput.name,
  description: validInput.description,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: validInput.aggregateRating.ratingValue,
    reviewCount: validInput.aggregateRating.reviewCount,
  },
  makesOffer: validInput.rooms.map((room) => ({
    "@type": "Offer",
    price: room.price.toFixed(2),
    priceCurrency: room.priceCurrency,
    availability: `https://schema.org/${room.availability}`,
    sku: room.sku,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: room.price,
      priceCurrency: room.priceCurrency,
      unitCode: "NI",
    },
    itemOffered: {
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
    },
    image: room.images,
  })),
};

describe("buildHostelSchema", () => {
  it("parses input via hostelInputSchema", () => {
    expect(() => hostelInputSchema.parse(validInput)).not.toThrow();
  });

  it("generates a HostelSchema object with expected structure", () => {
    const result = buildHostelSchema(validInput);
    expect(result).toEqual(expectedHostel);
  });

  it("throws a ZodError when the input is invalid", () => {
    const invalidInput = {
      ...validInput,
      rooms: [{ ...validInput.rooms[0], beds: 0 }],
    } as BuildHostelSchemaInput;
    expect(() => buildHostelSchema(invalidInput)).toThrow(ZodError);
  });
});