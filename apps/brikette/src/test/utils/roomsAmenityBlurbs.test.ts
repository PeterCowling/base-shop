
import "@testing-library/jest-dom";

import { roomsData } from "@/data/roomsData";
import roomsJson from "@/locales/en/rooms.json";

type BlurbEntry = { title: string; body: string };
type RoomsDetail = Record<string, { amenities?: BlurbEntry[] }>;

const detail = (roomsJson as { detail: RoomsDetail }).detail;

describe("rooms.json amenity blurbs", () => {
  const nonApartmentRooms = roomsData.filter((r) => r.id !== "apartment");

  it("TC-01: all 10 non-apartment rooms have a detail.{id}.amenities array", () => {
    for (const room of nonApartmentRooms) {
      expect(detail[room.id]?.amenities).toBeDefined();
      expect(Array.isArray(detail[room.id]?.amenities)).toBe(true);
    }
  });

  it("TC-02: room_10 amenities array has exactly 3 entries", () => {
    expect(detail["room_10"]?.amenities?.length).toBe(3);
  });

  it("TC-03: room_3 amenities array has exactly 3 entries", () => {
    expect(detail["room_3"]?.amenities?.length).toBe(3);
  });

  it("TC-04: all blurb entries have non-empty title and body", () => {
    for (const room of nonApartmentRooms) {
      const amenities = detail[room.id]?.amenities ?? [];
      for (const blurb of amenities) {
        expect(typeof blurb.title).toBe("string");
        expect(blurb.title.trim().length).toBeGreaterThan(0);
        expect(typeof blurb.body).toBe("string");
        expect(blurb.body.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("TC-05: room_9 blurbs do not mention terrace (room_9 has no terrace)", () => {
    const amenities = detail["room_9"]?.amenities ?? [];
    for (const blurb of amenities) {
      expect(blurb.title.toLowerCase()).not.toMatch(/terrace/);
      expect(blurb.body.toLowerCase()).not.toMatch(/terrace/);
    }
  });

  it("TC-06: room_5 and room_6 blurbs mention sea view or terrace", () => {
    for (const id of ["room_5", "room_6"] as const) {
      const amenities = detail[id]?.amenities ?? [];
      const allText = amenities.map((b) => `${b.title} ${b.body}`).join(" ").toLowerCase();
      expect(allText).toMatch(/terrace|sea/);
    }
  });
});
