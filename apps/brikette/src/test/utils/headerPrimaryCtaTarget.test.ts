import { describe, expect, it } from "@jest/globals";

import {
  HEADER_BOOKING_OPTIONS_ID,
  resolveHeaderPrimaryCtaTarget,
} from "@/utils/headerPrimaryCtaTarget";
import { getBookPath } from "@/utils/localizedRoutes";

describe("headerPrimaryCtaTarget", () => {
  it("keeps apartment detail pages on the private booking branch", () => {
    const target = resolveHeaderPrimaryCtaTarget("en", "/en/private-rooms/sea-view-apartment", null);

    expect(target).toEqual({
      href: "/en/book-private-accommodations",
      attribution: expect.objectContaining({
        resolved_intent: "private",
        product_type: "apartment",
        destination_funnel: "private",
      }),
    });
  });

  it("keeps double-room detail pages on the double-room booking branch", () => {
    const target = resolveHeaderPrimaryCtaTarget("en", "/en/private-rooms/double-room", null);

    expect(target).toEqual({
      href: "/en/book-double-room",
      attribution: expect.objectContaining({
        resolved_intent: "private",
        product_type: "double_private_room",
        destination_funnel: "private",
      }),
    });
  });

  it("anchors help surfaces to the on-page chooser when intent is unknown", () => {
    const target = resolveHeaderPrimaryCtaTarget("en", "/en/help", null);

    expect(target).toEqual({
      href: `/en/help#${HEADER_BOOKING_OPTIONS_ID}`,
      attribution: null,
    });
  });

  it("anchors deals surfaces to the on-page chooser when intent is unknown", () => {
    const target = resolveHeaderPrimaryCtaTarget("en", "/en/deals", null);

    expect(target).toEqual({
      href: `/en/deals#${HEADER_BOOKING_OPTIONS_ID}`,
      attribution: null,
    });
  });

  it("falls back to the hostel booking path on non-segmented routes", () => {
    const target = resolveHeaderPrimaryCtaTarget("en", "/en/experiences", null);

    expect(target).toEqual({
      href: getBookPath("en"),
      attribution: expect.objectContaining({
        resolved_intent: "hostel",
        destination_funnel: "hostel_central",
        next_page: getBookPath("en"),
      }),
    });
  });
});
