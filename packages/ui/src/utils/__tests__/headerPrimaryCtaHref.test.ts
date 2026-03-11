import { describe, expect, it } from "@jest/globals";

import {
  HEADER_PRIMARY_CTA_BOOKING_OPTIONS_ID,
  resolveHeaderPrimaryCtaHref,
} from "../headerPrimaryCtaHref";

describe("resolveHeaderPrimaryCtaHref", () => {
  it("anchors neutral support pages to the booking chooser in English", () => {
    expect(
      resolveHeaderPrimaryCtaHref({
        lang: "en",
        pathname: "/en/help",
      }),
    ).toBe(`/en/help#${HEADER_PRIMARY_CTA_BOOKING_OPTIONS_ID}`);

    expect(
      resolveHeaderPrimaryCtaHref({
        lang: "en",
        pathname: "/en/how-to-get-here",
      }),
    ).toBe(`/en/how-to-get-here#${HEADER_PRIMARY_CTA_BOOKING_OPTIONS_ID}`);

    expect(
      resolveHeaderPrimaryCtaHref({
        lang: "en",
        pathname: "/en/deals",
      }),
    ).toBe(`/en/deals#${HEADER_PRIMARY_CTA_BOOKING_OPTIONS_ID}`);
  });

  it("anchors localized support pages to the booking chooser across locales", () => {
    expect(
      resolveHeaderPrimaryCtaHref({
        lang: "fr",
        pathname: "/fr/aide",
      }),
    ).toBe(`/fr/aide#${HEADER_PRIMARY_CTA_BOOKING_OPTIONS_ID}`);

    expect(
      resolveHeaderPrimaryCtaHref({
        lang: "it",
        pathname: "/it/prenota-alloggi-privati",
      }),
    ).toBe("/it/prenota-alloggi-privati");
  });

  it("keeps private room routes on the private booking branch", () => {
    expect(
      resolveHeaderPrimaryCtaHref({
        lang: "en",
        pathname: "/en/private-rooms/sea-view-apartment",
      }),
    ).toBe("/en/book-private-accommodations");
  });

  it("preserves an explicit override when provided", () => {
    expect(
      resolveHeaderPrimaryCtaHref({
        lang: "en",
        pathname: "/en/help",
        primaryCtaHref: "/en/custom-booking",
      }),
    ).toBe("/en/custom-booking");
  });
});
