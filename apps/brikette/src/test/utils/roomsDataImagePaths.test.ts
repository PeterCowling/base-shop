
import "@testing-library/jest-dom";

import { roomsData, toFlatImageArray } from "@/data/roomsData";

describe("roomsData image paths", () => {
  it("TC-01: every room image path uses /img/ prefix", () => {
    for (const room of roomsData) {
      for (const imagePath of toFlatImageArray(room.images)) {
        expect(imagePath.startsWith("/img/")).toBe(true);
        expect(imagePath.startsWith("/images/")).toBe(false);
      }
    }
  });

  it("TC-02: every landingImage uses /img/ prefix", () => {
    for (const room of roomsData) {
      expect(room.landingImage.startsWith("/img/")).toBe(true);
      expect(room.landingImage.startsWith("/images/")).toBe(false);
    }
  });

  it("TC-03: apartment uses flat apt images not subdirectory", () => {
    const apartment = roomsData.find((room) => room.id === "apartment");
    expect(apartment).toBeDefined();
    expect(apartment!.images.bed).toBe("/img/apt1.jpg");
  });

  it("TC-04: apartment has at least 3 populated image slots", () => {
    const apartment = roomsData.find((room) => room.id === "apartment");
    expect(apartment).toBeDefined();
    expect(toFlatImageArray(apartment!.images).length).toBeGreaterThanOrEqual(3);
  });

  it("TC-05: room_3 bed image is a non-empty /img/ path", () => {
    const room3 = roomsData.find((room) => room.id === "room_3");
    expect(room3).toBeDefined();
    expect(room3!.images.bed).toBeTruthy();
    expect(room3!.images.bed.startsWith("/img/")).toBe(true);
  });

  it("TC-06: room_5 bed image is a non-empty /img/ path", () => {
    const room5 = roomsData.find((room) => room.id === "room_5");
    expect(room5).toBeDefined();
    expect(room5!.images.bed).toBeTruthy();
    expect(room5!.images.bed.startsWith("/img/")).toBe(true);
  });

  it("TC-07: every room has non-empty bed and bathroom image slots", () => {
    for (const room of roomsData) {
      expect(room.images.bed).toBeTruthy();
      expect(room.images.bathroom).toBeTruthy();
    }
  });
});
