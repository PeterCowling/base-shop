import { fireCtaClick } from "@/utils/ga4-events";

describe("GA4 cta_click coverage (GA4-cta-click)", () => {
  let originalGtag: typeof window.gtag;
  let gtag: jest.Mock;

  beforeEach(() => {
    originalGtag = window.gtag;
    gtag = jest.fn();
    window.gtag = gtag;
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("fires cta_click for desktop header and mobile nav CTAs", () => {
    fireCtaClick({ ctaId: "mobile_nav_check_availability", ctaLocation: "mobile_nav" });
    fireCtaClick({ ctaId: "header_check_availability", ctaLocation: "desktop_header" });

    const ctaCalls = gtag.mock.calls.filter((args) => args[0] === "event" && args[1] === "cta_click");
    expect(ctaCalls).toEqual(
      expect.arrayContaining([
        ["event", "cta_click", expect.objectContaining({ cta_id: "mobile_nav_check_availability", cta_location: "mobile_nav" })],
        ["event", "cta_click", expect.objectContaining({ cta_id: "header_check_availability", cta_location: "desktop_header" })],
      ]),
    );
  });

  it("fires cta_click for hero CTA and booking widget submit", () => {
    fireCtaClick({ ctaId: "hero_check_availability", ctaLocation: "home_hero" });
    fireCtaClick({ ctaId: "booking_widget_check_availability", ctaLocation: "home_booking_widget" });

    const ctaCalls = gtag.mock.calls.filter((args) => args[0] === "event" && args[1] === "cta_click");
    expect(ctaCalls).toEqual(
      expect.arrayContaining([
        ["event", "cta_click", expect.objectContaining({ cta_id: "hero_check_availability", cta_location: "home_hero" })],
        ["event", "cta_click", expect.objectContaining({ cta_id: "booking_widget_check_availability", cta_location: "home_booking_widget" })],
      ]),
    );
  });
});
