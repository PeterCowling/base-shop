import "@testing-library/jest-dom";

import dayjs from "dayjs";

import type { Room } from "@/data/roomsData";
import roomsData from "@/data/roomsData";
import { isSoldOut } from "@/rooms/availability";
import { getPriceForDate } from "@/rooms/pricing";
import type { DailyRate, RateCalendar } from "@/types/rates";

const makeDailyRate = (iso: string, nr: number): DailyRate => ({ date: iso, nr });

const today = dayjs("2025-06-13").toDate();
const tomorrow = dayjs(today).add(1, "day").toDate();
const todayIso = dayjs(today).format("YYYY-MM-DD");

const baseRoom = roomsData.find((room) => room.id === "double_room") as Room;

const roomDirect = baseRoom;

const roomOTA: Room = {
  ...baseRoom,
  rateCodes: {
    ...baseRoom.rateCodes,
    direct: { ...baseRoom.rateCodes.direct, nr: "" },
  },
};

const roomWidgetNR: Room = {
  ...roomOTA,
  widgetRateCodeNR: "433894",
};

const roomWidgetFlex: Room = {
  ...roomWidgetNR,
  widgetRateCodeNR: "",
  widgetRateCodeFlex: "433894",
};

const roomFallback: Room = {
  ...roomWidgetFlex,
  widgetRateCodeFlex: "",
};

const rooms: Record<string, Room> = {
  direct: roomDirect,
  ota: roomOTA,
  widgetNR: roomWidgetNR,
  widgetFlex: roomWidgetFlex,
  fallback: roomFallback,
};

const rates: RateCalendar = {
  "433883": [makeDailyRate(todayIso, 100)],
  "433491": [makeDailyRate(todayIso, 120)],
  "433894": [makeDailyRate(todayIso, 130)],
  double_room: [makeDailyRate(todayIso, 150)],
};

describe("getPriceForDate", () => {
  it.each([
    ["direct", 100],
    ["ota", 120],
    ["widgetNR", 130],
    ["widgetFlex", 130],
    ["fallback", 150],
  ])("returns the expected price using priority lookup (%s)", (key, expected) => {
    const price = getPriceForDate(rooms[key], today, rates);
    expect(price).toBe(expected);
  });

  it("returns undefined when given a null rate-calendar", () => {
    expect(getPriceForDate(rooms.direct, today, null)).toBeUndefined();
  });

  it("returns undefined when no rate exists for the date", () => {
    expect(getPriceForDate(rooms.direct, tomorrow, rates)).toBeUndefined();
  });

  it("returns undefined when the room has no matching rate-code", () => {
    const orphanRoom: Room = {
      ...baseRoom,
      id: "room_10",
      rateCodes: { direct: { nr: "", flex: "" }, ota: { nr: "", flex: "" } },
      widgetRateCodeNR: "",
      widgetRateCodeFlex: "",
    };
    expect(getPriceForDate(orphanRoom, today, rates)).toBeUndefined();
  });
});

describe("isSoldOut", () => {
  it("returns false when a price exists", () => {
    expect(isSoldOut(rooms.direct, today, rates)).toBe(false);
  });

  it("returns true when no price exists for the date", () => {
    expect(isSoldOut(rooms.direct, tomorrow, rates)).toBe(true);
  });

  it("returns true when rates are null", () => {
    expect(isSoldOut(rooms.direct, today, null)).toBe(true);
  });

  it("returns true when the room has no rate codes", () => {
    const orphanRoom: Room = {
      ...baseRoom,
      id: "room_10",
      rateCodes: { direct: { nr: "", flex: "" }, ota: { nr: "", flex: "" } },
      widgetRateCodeNR: "",
      widgetRateCodeFlex: "",
    };
    expect(isSoldOut(orphanRoom, today, rates)).toBe(true);
  });
});