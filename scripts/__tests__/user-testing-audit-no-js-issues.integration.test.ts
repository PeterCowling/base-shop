import noJsPredicates from "../../.claude/skills/user-testing-audit/scripts/no-js-predicates.cjs";

const { evaluateNoJsRoute, collectNoJsRegressionIssues } = noJsPredicates;

describe("user-testing-audit no-JS issue integration", () => {
  it("maps route predicate failures into actionable issue IDs", () => {
    const routeChecks = {
      home: evaluateNoJsRoute({
        routeKey: "home",
        routePath: "/en",
        status: 200,
        html: `
          <html><head><title>Hostel Brikette</title></head>
          <body>
            <h1>Welcome</h1>
            locationSection.mapLabel
            <button type="button">Check availability</button>
          </body></html>
        `,
      }),
      rooms: evaluateNoJsRoute({
        routeKey: "rooms",
        routePath: "/en/rooms",
        status: 200,
        html: `
          <html><body>
            BAILOUT_TO_CLIENT_SIDE_RENDERING
            <button type="button">Check availability</button>
          </body></html>
        `,
      }),
      roomDetail: evaluateNoJsRoute({
        routeKey: "roomDetail",
        routePath: "/en/rooms/double_room",
        status: 200,
        html: `
          <html><body>
            <h1>double_room</h1>
            roomImage.photoAlt loadingPrice
          </body></html>
        `,
      }),
      experiences: evaluateNoJsRoute({
        routeKey: "experiences",
        routePath: "/en/experiences",
        status: 200,
        html: `
          <html><body>
            BAILOUT_TO_CLIENT_SIDE_RENDERING
            <a href="/en/experiences/path-of-the-gods"><img alt="Path of the Gods" /></a>
          </body></html>
        `,
      }),
      howToGetHere: evaluateNoJsRoute({
        routeKey: "howToGetHere",
        routePath: "/en/how-to-get-here",
        status: 200,
        html: "<html><body>BAILOUT_TO_CLIENT_SIDE_RENDERING filters.resultsCount</body></html>",
      }),
      deals: evaluateNoJsRoute({
        routeKey: "deals",
        routePath: "/en/deals",
        status: 200,
        html: `
          <html>
            <head><title>Save 15% at Hostel Brikette</title></head>
            <body><h1>Deals</h1>No current deals available.</body>
          </html>
        `,
      }),
    };

    const issues = collectNoJsRegressionIssues(routeChecks);
    const ids = issues.map((issue: { id: string }) => issue.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "no-js-i18n-key-leakage",
        "no-js-route-shell-bailout",
        "no-js-booking-funnel-key-leakage",
        "booking-cta-no-js-fallback",
        "booking-cta-visible-label-missing",
        "experiences-guide-text-links-missing",
        "room-inventory-crawlability-missing",
        "contact-email-mailto-missing",
        "social-links-accessible-name-missing",
        "deals-meta-body-parity",
        "social-proof-snapshot-date",
      ])
    );
  });

  it("returns no no-JS regression issues when all predicates pass", () => {
    const cleanHome = `
      <html>
        <head><title>Hostel Brikette</title></head>
        <body>
          <h1>Hostel Brikette</h1>
          Welcome to Positano.
          As of November 2025.
          <a href="mailto:hostelpositano@gmail.com">hostelpositano@gmail.com</a>
          <a href="https://instagram.com/brikette" aria-label="Instagram"><svg aria-hidden="true"></svg></a>
          <a href="/en/book">Check availability</a>
          <a href="/en/book">Book Now</a>
        </body>
      </html>
    `;

    const routeChecks = {
      home: evaluateNoJsRoute({
        routeKey: "home",
        routePath: "/en",
        status: 200,
        html: cleanHome,
      }),
      rooms: evaluateNoJsRoute({
        routeKey: "rooms",
        routePath: "/en/rooms",
        status: 200,
        html: `
          <html><body>
            <h1>Rooms</h1>
            <a href="/en/book">Check availability</a>
            <a href="/en/book">Book Now</a>
            <a href="/en/rooms/double_room">Double Room</a>
            <script type="application/ld+json">{"@type":"OfferCatalog","name":"Rooms & Rates"}</script>
          </body></html>
        `,
      }),
      roomDetail: evaluateNoJsRoute({
        routeKey: "roomDetail",
        routePath: "/en/rooms/double_room",
        status: 200,
        html: `
          <html><body>
            <h1>Double Room</h1>
            <a href="https://book.example">Book Now</a>
            <p>Private double room with ensuite bathroom and sea-view terrace access.</p>
            <script type="application/ld+json">{"@type":"HotelRoom","name":"Double Room"}</script>
          </body></html>
        `,
      }),
      experiences: evaluateNoJsRoute({
        routeKey: "experiences",
        routePath: "/en/experiences",
        status: 200,
        html: `
          <html><body>
            <h1>Experiences</h1>
            <a href="/en/book">Book Now</a>
            <a href="/en/experiences/path-of-the-gods">Path of the Gods</a>
          </body></html>
        `,
      }),
      howToGetHere: evaluateNoJsRoute({
        routeKey: "howToGetHere",
        routePath: "/en/how-to-get-here",
        status: 200,
        html: '<html><body><h1>How to Get Here</h1><a href="/en/book">Book Now</a></body></html>',
      }),
      deals: evaluateNoJsRoute({
        routeKey: "deals",
        routePath: "/en/deals",
        status: 200,
        html: "<html><head><title>Deals & Offers</title></head><body><h1>Deals & Offers</h1></body></html>",
      }),
    };

    const issues = collectNoJsRegressionIssues(routeChecks);
    expect(issues).toHaveLength(0);
  });
});
