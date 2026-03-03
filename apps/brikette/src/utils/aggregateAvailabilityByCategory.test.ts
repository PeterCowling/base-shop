// apps/brikette/src/utils/aggregateAvailabilityByCategory.test.ts
// Unit tests for the aggregateAvailabilityByCategory utility.

import type { OctorateRoom } from "@/types/octorate-availability";

import { aggregateAvailabilityByCategory } from "./aggregateAvailabilityByCategory";

function makeRoom(overrides: Partial<OctorateRoom>): OctorateRoom {
  return {
    octorateRoomName: "Dorm",
    octorateRoomId: "3",
    available: true,
    priceFrom: 50,
    nights: 2,
    ratePlans: [{ label: "Non-Refundable" }],
    ...overrides,
  };
}

describe("aggregateAvailabilityByCategory", () => {
  // TC-03-01: Empty rooms array → undefined
  it("TC-03-01: returns undefined when rooms array is empty", () => {
    expect(aggregateAvailabilityByCategory([], "Dorm")).toBeUndefined();
  });

  // TC-03-01b: Empty category string → undefined
  it("TC-03-01b: returns undefined when category is empty string", () => {
    const rooms = [makeRoom({ octorateRoomName: "Dorm" })];
    expect(aggregateAvailabilityByCategory(rooms, "")).toBeUndefined();
  });

  // TC-03-01c: No sections match the category → undefined
  it("TC-03-01c: returns undefined when no sections match the category", () => {
    const rooms = [makeRoom({ octorateRoomName: "Double" })];
    expect(aggregateAvailabilityByCategory(rooms, "Dorm")).toBeUndefined();
  });

  // TC-03-02: Single available section → synthetic record with ratePlans: []
  it("TC-03-02: single available section → available=true, priceFrom preserved, ratePlans=[]", () => {
    const rooms = [makeRoom({ octorateRoomName: "Dorm", available: true, priceFrom: 94.99 })];
    const result = aggregateAvailabilityByCategory(rooms, "Dorm");

    expect(result).toBeDefined();
    expect(result!.octorateRoomName).toBe("Dorm");
    expect(result!.available).toBe(true);
    expect(result!.priceFrom).toBe(94.99);
    expect(result!.ratePlans).toEqual([]);
  });

  // TC-03-03: Single sold-out section → available=false, priceFrom=null
  it("TC-03-03: single sold-out section → available=false, priceFrom=null, ratePlans=[]", () => {
    const rooms = [makeRoom({ octorateRoomName: "Dorm", available: false, priceFrom: null, ratePlans: [] })];
    const result = aggregateAvailabilityByCategory(rooms, "Dorm");

    expect(result).toBeDefined();
    expect(result!.available).toBe(false);
    expect(result!.priceFrom).toBeNull();
    expect(result!.ratePlans).toEqual([]);
  });

  // TC-03-04: Two available sections → min priceFrom returned
  it("TC-03-04: two available Dorm sections → min priceFrom selected", () => {
    const rooms = [
      makeRoom({ octorateRoomName: "Dorm", available: true, priceFrom: 80 }),
      makeRoom({ octorateRoomName: "Dorm", available: true, priceFrom: 65 }),
    ];
    const result = aggregateAvailabilityByCategory(rooms, "Dorm");

    expect(result!.available).toBe(true);
    expect(result!.priceFrom).toBe(65);
  });

  // TC-03-05: Mixed available and sold-out sections → available=true, min priceFrom from available only
  it("TC-03-05: mixed sections → available=true, priceFrom from available sections only", () => {
    const rooms = [
      makeRoom({ octorateRoomName: "Dorm", available: false, priceFrom: null, ratePlans: [] }),
      makeRoom({ octorateRoomName: "Dorm", available: true, priceFrom: 72 }),
      makeRoom({ octorateRoomName: "Dorm", available: true, priceFrom: 90 }),
    ];
    const result = aggregateAvailabilityByCategory(rooms, "Dorm");

    expect(result!.available).toBe(true);
    expect(result!.priceFrom).toBe(72);
  });

  // TC-03-06: All sections sold out → available=false, priceFrom=null
  it("TC-03-06: all sold-out sections → available=false, priceFrom=null, ratePlans=[]", () => {
    const rooms = [
      makeRoom({ octorateRoomName: "Dorm", available: false, priceFrom: null, ratePlans: [] }),
      makeRoom({ octorateRoomName: "Dorm", available: false, priceFrom: null, ratePlans: [] }),
    ];
    const result = aggregateAvailabilityByCategory(rooms, "Dorm");

    expect(result!.available).toBe(false);
    expect(result!.priceFrom).toBeNull();
    expect(result!.ratePlans).toEqual([]);
  });

  // TC-03-07: Non-matching sections ignored; only matching sections aggregate
  it("TC-03-07: non-matching sections are ignored; only Dorm sections aggregate", () => {
    const rooms = [
      makeRoom({ octorateRoomName: "Double", available: true, priceFrom: 200 }),
      makeRoom({ octorateRoomName: "Dorm", available: true, priceFrom: 55 }),
      makeRoom({ octorateRoomName: "Apartment", available: true, priceFrom: 300 }),
    ];
    const result = aggregateAvailabilityByCategory(rooms, "Dorm");

    expect(result!.octorateRoomName).toBe("Dorm");
    expect(result!.priceFrom).toBe(55);
  });

  // TC-03-08: nights value preserved from first matching section
  it("TC-03-08: nights value is taken from the first matching section", () => {
    const rooms = [makeRoom({ octorateRoomName: "Dorm", nights: 3 })];
    const result = aggregateAvailabilityByCategory(rooms, "Dorm");

    expect(result!.nights).toBe(3);
  });
});
