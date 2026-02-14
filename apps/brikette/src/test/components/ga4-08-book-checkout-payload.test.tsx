/**
 * GA4-08: Shared room-booking checkout tracking payload
 *
 * Verifies begin_checkout payload is emitted without requiring a confirm URL.
 */
import { fireCheckoutGA4 } from "@/app/[lang]/book/BookPageContent";

describe("BookPageContent GA4 payload (GA4-08)", () => {
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
    fireCheckoutGA4("room_10", "flex", "2026-06-10", "2026-06-12");

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
            item_category: "flex",
            price: 60.75,
            quantity: 2,
          }),
        ]),
      }),
    );
  });
});
