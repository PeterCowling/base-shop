import {
  buildRoomItem,
  fireBeginCheckoutRoomSelected,
  fireSearchAvailability,
  fireSelectItem,
  fireSelectPromotion,
  fireViewPromotion,
  isEventSource,
  shouldFireImpressionOnce,
} from "@/utils/ga4-events";

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

// TASK-31: New event helpers + updated signatures
describe("ga4-events TASK-31 contracts", () => {
  let originalGtag: typeof window.gtag;
  let gtagMock: jest.Mock;

  beforeEach(() => {
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    window.gtag = gtagMock;
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  // TC-01: fireViewPromotion fires view_promotion with promotions array
  it("TC-01: fireViewPromotion fires gtag view_promotion with promotions array", () => {
    fireViewPromotion({
      promotions: [
        { promotion_id: "deal-summer", promotion_name: "Summer Deal" },
        { promotion_id: "deal-winter", promotion_name: "Winter Deal" },
      ],
    });

    expect(gtagMock).toHaveBeenCalledTimes(1);
    expect(gtagMock).toHaveBeenCalledWith(
      "event",
      "view_promotion",
      expect.objectContaining({
        promotions: [
          { promotion_id: "deal-summer", promotion_name: "Summer Deal" },
          { promotion_id: "deal-winter", promotion_name: "Winter Deal" },
        ],
      }),
    );
  });

  // TC-02: fireSelectPromotion fires select_promotion with single promotion wrapped in array
  it("TC-02: fireSelectPromotion fires gtag select_promotion with single promotion", () => {
    fireSelectPromotion({ promotion: { promotion_id: "deal-summer", promotion_name: "Summer Deal" } });

    expect(gtagMock).toHaveBeenCalledTimes(1);
    expect(gtagMock).toHaveBeenCalledWith(
      "event",
      "select_promotion",
      expect.objectContaining({
        promotions: [{ promotion_id: "deal-summer", promotion_name: "Summer Deal" }],
      }),
    );
  });

  // TC-03: fireSelectItem fires with full GA4 item shape (item_name, item_category, affiliation, currency)
  it("TC-03: fireSelectItem fires select_item with full GA4 item fields", () => {
    fireSelectItem({ itemListId: "home_rooms_carousel", roomSku: "room_10", itemName: "Dorm 10", plan: "nr" });

    expect(gtagMock).toHaveBeenCalledTimes(1);
    const [, , payload] = gtagMock.mock.calls[0] as [string, string, Record<string, unknown>];
    const items = payload.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      item_id: "room_10",
      item_name: "Dorm 10",
      item_category: "hostel",
      affiliation: "Hostel Brikette",
      currency: "EUR",
      item_variant: "nr",
    });
  });

  // TC-04: fireSearchAvailability does not pass raw date strings — only nights + lead_time_days
  it("TC-04: fireSearchAvailability passes nights and lead_time_days, not raw date strings", () => {
    fireSearchAvailability({ source: "header", checkin: "2026-06-01", checkout: "2026-06-05", pax: 2 });

    expect(gtagMock).toHaveBeenCalledTimes(1);
    const [, , payload] = gtagMock.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(payload).not.toHaveProperty("checkin");
    expect(payload).not.toHaveProperty("checkout");
    expect(payload).toHaveProperty("nights");
    expect(payload).toHaveProperty("lead_time_days");
    expect(typeof payload.nights).toBe("number");
    expect(typeof payload.lead_time_days).toBe("number");
  });

  // TC-05: fireBeginCheckoutRoomSelected passes coupon when provided (deal context)
  it("TC-05: fireBeginCheckoutRoomSelected includes coupon in begin_checkout when deal context", () => {
    fireBeginCheckoutRoomSelected({
      source: "header",
      roomSku: "room_10",
      plan: "nr",
      checkin: "2026-06-01",
      checkout: "2026-06-05",
      pax: 2,
      coupon: "SUMMER20",
    });

    expect(gtagMock).toHaveBeenCalledTimes(1);
    const [, , payload] = gtagMock.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(payload).toMatchObject({ coupon: "SUMMER20" });
  });

  // TC-05 complement: no coupon key emitted when coupon is absent
  it("TC-05b: fireBeginCheckoutRoomSelected omits coupon key when not provided", () => {
    fireBeginCheckoutRoomSelected({
      source: "header",
      roomSku: "room_10",
      plan: "nr",
      checkin: "2026-06-01",
      checkout: "2026-06-05",
      pax: 2,
    });

    const [, , payload] = gtagMock.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(payload).not.toHaveProperty("coupon");
  });

  // buildRoomItem: updated return type includes full GA4 item fields
  it("buildRoomItem returns full GA4 item shape with item_category, affiliation, currency", () => {
    expect(buildRoomItem({ roomSku: "room_10", itemName: "Dorm 10", plan: "flex", index: 3 })).toMatchObject({
      item_id: "room_10",
      item_name: "Dorm 10",
      item_category: "hostel",
      affiliation: "Hostel Brikette",
      currency: "EUR",
      item_variant: "flex",
      index: 3,
    });
  });

  // buildRoomItem: falls back to roomSku when itemName is not provided
  it("buildRoomItem falls back to roomSku as item_name when itemName is absent", () => {
    const item = buildRoomItem({ roomSku: "room_10", plan: "nr" });
    expect(item.item_name).toBe("room_10");
  });
});
