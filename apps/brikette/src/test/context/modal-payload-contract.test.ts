// src/test/context/modal-payload-contract.test.ts
/* -------------------------------------------------------------------------- */
/*  TASK-04: Typed modal payload registry — TC-03 + TC-05                     */
/* -------------------------------------------------------------------------- */

import { parseBooking2Payload, parseBookingPayload } from "../../context/modal/payloadMap";

// TC-03: Booking V2 payload field preservation via boundary validator
describe("parseBooking2Payload — TC-03: payload field preservation", () => {
  it("preserves checkIn, checkOut, adults from a well-formed object", () => {
    const result = parseBooking2Payload({
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      adults: 2,
    });
    expect(result).toEqual(
      expect.objectContaining({
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        adults: 2,
      }),
    );
  });

  it("preserves roomSku, plan, octorateRateCode, source, item_list_id", () => {
    const result = parseBooking2Payload({
      roomSku: "dormitory-6bed",
      plan: "nr",
      octorateRateCode: "NR001",
      source: "room_card",
      item_list_id: "rooms_list",
    });
    expect(result).toEqual(
      expect.objectContaining({
        roomSku: "dormitory-6bed",
        plan: "nr",
        octorateRateCode: "NR001",
        source: "room_card",
        item_list_id: "rooms_list",
      }),
    );
  });

  it("accepts 'flex' plan value", () => {
    const result = parseBooking2Payload({ plan: "flex" });
    expect(result?.plan).toBe("flex");
  });
});

// TC-05: Boundary validator rejects malformed externally sourced payload
describe("parseBooking2Payload — TC-05: rejects malformed external payloads", () => {
  it("returns null for null input", () => {
    expect(parseBooking2Payload(null)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseBooking2Payload("evil-string")).toBeNull();
    expect(parseBooking2Payload(42)).toBeNull();
    expect(parseBooking2Payload(true)).toBeNull();
  });

  it("returns null for array input", () => {
    expect(parseBooking2Payload(["check-in", "check-out"])).toBeNull();
  });

  it("returns null when plan has invalid value", () => {
    expect(parseBooking2Payload({ plan: "premium" })).toBeNull();
    expect(parseBooking2Payload({ plan: "FLEX" })).toBeNull();
  });

  it("returns null when adults is non-numeric", () => {
    expect(parseBooking2Payload({ adults: "two" })).toBeNull();
    expect(parseBooking2Payload({ adults: null })).toBeNull();
  });

  it("omits fields with wrong types silently (string-expected fields)", () => {
    const result = parseBooking2Payload({
      checkIn: 12345,    // should be string
      roomSku: true,     // should be string
      source: undefined, // absent — fine
    });
    expect(result).not.toBeNull();
    expect(result?.checkIn).toBeUndefined();
    expect(result?.roomSku).toBeUndefined();
    expect(result?.source).toBeUndefined();
  });
});

// TC-05: parseBookingPayload boundary validation
describe("parseBookingPayload — TC-05: rejects malformed external payloads", () => {
  it("returns null for null input", () => {
    expect(parseBookingPayload(null)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parseBookingPayload("bad")).toBeNull();
    expect(parseBookingPayload(0)).toBeNull();
  });

  it("returns null when rateType is invalid", () => {
    expect(parseBookingPayload({ rateType: "free" })).toBeNull();
  });

  it("returns null when adults is non-numeric", () => {
    expect(parseBookingPayload({ adults: "three" })).toBeNull();
  });

  it("preserves deal, source, checkIn, checkOut, adults", () => {
    const result = parseBookingPayload({
      deal: "SUMMER25",
      source: "deals_page",
      checkIn: "2026-07-01",
      checkOut: "2026-07-07",
      adults: 3,
    });
    expect(result).toEqual(
      expect.objectContaining({
        deal: "SUMMER25",
        source: "deals_page",
        checkIn: "2026-07-01",
        checkOut: "2026-07-07",
        adults: 3,
      }),
    );
  });
});
