import "@testing-library/jest-dom";

import { roomsData } from "@/data/roomsData";

describe("roomsData features", () => {
  const nonApartmentRooms = roomsData.filter((r) => r.id !== "apartment");

  it("TC-01: all 10 non-apartment rooms have a features object", () => {
    expect(nonApartmentRooms).toHaveLength(10);
    for (const room of nonApartmentRooms) {
      expect(room.features).toBeDefined();
    }
  });

  it("TC-02: all 10 rooms have non-empty bedSpec and bathroomSpec", () => {
    for (const room of nonApartmentRooms) {
      expect(room.features?.bedSpec).toBeTruthy();
      expect(room.features?.bathroomSpec).toBeTruthy();
    }
  });

  it("TC-03: rooms 11 and 12 have inRoomLockers true", () => {
    const room11 = roomsData.find((r) => r.id === "room_11");
    const room12 = roomsData.find((r) => r.id === "room_12");
    expect(room11?.features?.inRoomLockers).toBe(true);
    expect(room12?.features?.inRoomLockers).toBe(true);
  });

  it("TC-04: double_room, room_5, room_6, room_11, room_12 have terracePresent true", () => {
    const terrace = ["double_room", "room_5", "room_6", "room_11", "room_12"];
    for (const id of terrace) {
      const room = roomsData.find((r) => r.id === id);
      expect(room?.features?.terracePresent).toBe(true);
    }
  });

  it("TC-05: room_9 has no terracePresent", () => {
    const room9 = roomsData.find((r) => r.id === "room_9");
    expect(room9?.features?.terracePresent).toBeFalsy();
  });

  it("TC-06: apartment has no features object", () => {
    const apartment = roomsData.find((r) => r.id === "apartment");
    expect(apartment?.features).toBeUndefined();
  });
});
