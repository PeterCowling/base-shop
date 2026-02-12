import noJsPredicates from "../../.claude/skills/meta-user-test/scripts/no-js-predicates.cjs";

const {
  detectBookingFunnelI18nKeyLeaks,
  detectBookingCtaFallback,
  detectCrawlableGuideDetailLinks,
  detectRoomInventoryCrawlability,
  evaluateNoJsRoute,
} = noJsPredicates;

describe("meta-user-test no-JS predicates (unit)", () => {
  it("detects booking-funnel i18n key tokens and deduplicates them", () => {
    const text =
      "loadingPrice roomImage.photoAlt roomImage.photoAlt filters.resultsCount checkRatesFlexible moreAboutThisRoom";

    const leaks = detectBookingFunnelI18nKeyLeaks(text);

    expect(leaks).toEqual(
      expect.arrayContaining([
        "loadingPrice",
        "roomImage.photoAlt",
        "filters.resultsCount",
        "checkRatesFlexible",
        "moreAboutThisRoom",
      ])
    );
    expect(
      leaks.filter((item: string) => item === "roomImage.photoAlt")
    ).toHaveLength(1);
  });

  it("flags missing fallback links when booking CTAs are button-only", () => {
    const html = `
      <button type="button">Check availability</button>
      <button type="button" aria-label="Book Now"><span>Book Now</span></button>
    `;

    const result = detectBookingCtaFallback(html);

    expect(result.hasFallbackLink).toBe(false);
    expect(result.failingLabels).toEqual(
      expect.arrayContaining(["Check availability", "Book Now"])
    );
  });

  it("flags plain-text booking labels that are not interactive elements", () => {
    const html = `
      <p>Check availability</p>
      <span>Book Now</span>
    `;

    const result = detectBookingCtaFallback(html);

    expect(result.hasFallbackLink).toBe(false);
    expect(result.failingLabels).toEqual(
      expect.arrayContaining(["Check availability", "Book Now"])
    );
  });

  it("passes when each booking CTA has an anchor fallback", () => {
    const html = `
      <button type="button">Check availability</button>
      <a href="/en/book">Check availability</a>
      <button type="button" aria-label="Book Now"><span>Book Now</span></button>
      <a href="/en/rooms/room_12?book=1" aria-label="Book Now">Book Now</a>
    `;

    const result = detectBookingCtaFallback(html);

    expect(result.hasFallbackLink).toBe(true);
    expect(result.failingLabels).toEqual([]);
  });

  it("evaluates route checks with bailout and key-leak predicates", () => {
    const html = `
      <html>
        <head><title>Hostel Brikette</title></head>
        <body>
          <h1>Welcome</h1>
          BAILOUT_TO_CLIENT_SIDE_RENDERING
          locationSection.mapLabel loadingPrice roomImage.photoAlt
          <button type="button">Check availability</button>
        </body>
      </html>
    `;

    const route = evaluateNoJsRoute({
      routeKey: "home",
      routePath: "/en",
      status: 200,
      html,
    });

    expect(route.checks.hasNoBailoutMarker).toBe(false);
    expect(route.checks.hasNoI18nKeyLeak).toBe(false);
    expect(route.checks.hasNoBookingFunnelI18nLeak).toBe(false);
    expect(route.checks.hasBookingCtaFallback).toBe(false);
  });

  it("treats blank or symbol-only H1 text as non-meaningful", () => {
    const route = evaluateNoJsRoute({
      routeKey: "experiences",
      routePath: "/en/experiences",
      status: 200,
      html: "<html><body><h1>#</h1></body></html>",
    });

    expect(route.h1Count).toBe(1);
    expect(route.checks.hasMeaningfulH1).toBe(false);
  });

  it("requires visible `Book Now` label across booking-funnel routes", () => {
    const route = evaluateNoJsRoute({
      routeKey: "experiences",
      routePath: "/en/experiences",
      status: 200,
      html: '<html><body><h1>Experiences</h1><a href="/en/book">Check availability</a></body></html>',
    });

    expect(route.checks.hasVisibleBookingCtaLabel).toBe(false);
    expect(route.bookingCtaLabelVisibility.missingLabels).toEqual(["Book Now"]);
  });

  it("evaluates explicit home mailto and social-link naming checks", () => {
    const route = evaluateNoJsRoute({
      routeKey: "home",
      routePath: "/en",
      status: 200,
      html: `
        <html><body>
          <h1>Hostel Brikette</h1>
          As of November 2025.
          <a href="mailto:hostelpositano@gmail.com">hostelpositano@gmail.com</a>
          <a href="https://instagram.com/brikette" aria-label="Instagram"><svg aria-hidden="true"></svg></a>
          <a href="/en/book">Book Now</a>
        </body></html>
      `,
    });

    expect(route.checks.hasMailtoContactLink).toBe(true);
    expect(route.checks.hasNamedSocialLinks).toBe(true);
  });

  it("detects crawlable text links for experiences guide detail routes", () => {
    const result = detectCrawlableGuideDetailLinks(
      `
      <a href="/en/experiences/path-of-the-gods">Path of the Gods</a>
      <a href="/en/experiences/positano-beaches"><img alt="Positano beaches" /></a>
    `,
      "/en/experiences"
    );

    expect(result.hasCrawlableGuideLinks).toBe(true);
    expect(result.textLinkedGuideCount).toBe(1);
  });

  it("flags room inventory crawlability gaps when list links are image-only and schema is absent", () => {
    const result = detectRoomInventoryCrawlability(
      `
      <a href="/en/rooms/double_room"><img alt="double room" /></a>
      `,
      "/en/rooms"
    );

    expect(result.hasRoomInventoryCrawlability).toBe(false);
    expect(result.routeType).toBe("rooms-list");
  });

  it("passes room detail crawlability when schema and descriptive copy are present", () => {
    const result = detectRoomInventoryCrawlability(
      `
      <script type="application/ld+json">{"@type":"HotelRoom","name":"Double Room"}</script>
      <p>Private double room with ensuite bathroom and sea-view terrace access.</p>
    `,
      "/en/rooms/double_room"
    );

    expect(result.hasRoomInventoryCrawlability).toBe(true);
    expect(result.routeType).toBe("room-detail");
  });
});
