
import "@testing-library/jest-dom";

import { roomsData } from "@/data/roomsData";

describe("roomsData image paths", () => {
  it("TC-01: every imagesRaw path uses /img/ prefix", () => {
    for (const room of roomsData) {
      for (const imagePath of room.imagesRaw) {
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
    expect(apartment!.imagesRaw[0]).toBe("/img/apt1.jpg");
  });

  it("TC-04: apartment imagesRaw has 3 entries", () => {
    const apartment = roomsData.find((room) => room.id === "apartment");
    expect(apartment).toBeDefined();
    expect(apartment!.imagesRaw.length).toBe(3);
  });
});
