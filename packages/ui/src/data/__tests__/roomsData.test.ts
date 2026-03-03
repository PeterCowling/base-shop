import roomsData from "../roomsData";

describe("roomsData catalogue", () => {
  it("exports a non-empty array of rooms", () => {
    expect(Array.isArray(roomsData)).toBe(true);
    expect(roomsData.length).toBeGreaterThan(0);
  });

  it("every room has required fields", () => {
    for (const room of roomsData) {
      expect(room.id).toBeDefined();
      expect(room.sku).toBeDefined();
      expect(room.widgetRoomCode).toBeDefined();
      expect(room.occupancy).toBeGreaterThan(0);
      expect(room.basePrice.currency).toBe("EUR");
      expect(room.basePrice.amount).toBeGreaterThan(0);
      expect(room.images.bed).toBeTruthy();
      expect(room.images.bathroom).toBeTruthy();
      expect(room.landingImage).toBeTruthy();
    }
  });

  it("room IDs are unique", () => {
    const ids = roomsData.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
