import { buildRoomItem, isEventSource, shouldFireImpressionOnce } from "@/utils/ga4-events";

describe("ga4-events contract primitives", () => {
  it("buildRoomItem uses roomSku as stable item_id and includes item_variant when provided", () => {
    expect(buildRoomItem({ roomSku: "room_10", plan: "flex", index: 3 })).toEqual(
      expect.objectContaining({
        item_id: "room_10",
        item_name: "room_10",
        item_variant: "flex",
        index: 3,
      }),
    );
  });

  it("buildRoomItem does not throw for unknown SKUs", () => {
    expect(() => buildRoomItem({ roomSku: "unknown_room", plan: "nr" })).not.toThrow();
  });

  it("isEventSource only accepts canonical values", () => {
    expect(isEventSource("header")).toBe(true);
    expect(isEventSource("Header")).toBe(false);
    expect(isEventSource("header_cta")).toBe(false);
  });

  it("shouldFireImpressionOnce returns true only on first sight of a key (within a navigation)", () => {
    const key = "view_item_list:/en/rooms:rooms_index";
    expect(shouldFireImpressionOnce(key)).toBe(true);
    expect(shouldFireImpressionOnce(key)).toBe(false);
  });

  it("shouldFireImpressionOnce allows the same key after pathname changes (per-navigation dedupe)", () => {
    const key = "view_item_list:rooms_index";

    window.history.pushState({}, "", "/en/rooms");
    expect(shouldFireImpressionOnce(key)).toBe(true);
    expect(shouldFireImpressionOnce(key)).toBe(false);

    window.history.pushState({}, "", "/en/book");
    expect(shouldFireImpressionOnce(key)).toBe(true);
  });
});
