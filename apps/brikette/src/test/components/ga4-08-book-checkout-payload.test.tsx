/**
 * GA4-08: Shared room-booking checkout tracking payload
 *
 * Verifies begin_checkout payload is emitted with e-commerce parameters.
 */
import { fireRoomBeginCheckout } from "@/utils/ga4-events";

describe("Room begin_checkout GA4 payload (GA4-08)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("fires begin_checkout with nights-based value and item payload", () => {
    fireRoomBeginCheckout({ roomSku: "room_10", plan: "flex", checkin: "2026-06-10", checkout: "2026-06-12" });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "begin_checkout",
      expect.objectContaining({
        currency: "EUR",
        value: 121.5,
        items: expect.arrayContaining([
          expect.objectContaining({
            item_id: "room_10",
            item_name: "room_10",
            item_variant: "flex",
            price: 60.75,
            quantity: 2,
          }),
        ]),
      }),
    );
  });
});
