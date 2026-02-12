import noJsPredicates from "../../.claude/skills/user-testing-audit/scripts/no-js-predicates.cjs";

const { evaluateNoJsRoute, collectNoJsRegressionIssues } = noJsPredicates;

type RouteFixture = {
  routeKey: "home" | "rooms" | "roomDetail" | "experiences" | "howToGetHere" | "deals";
  routePath: string;
  html: string;
};

function runNoJsAuditFlow(fixtures: RouteFixture[]) {
  const routeChecks = Object.fromEntries(
    fixtures.map((fixture) => [
      fixture.routeKey,
      evaluateNoJsRoute({
        routeKey: fixture.routeKey,
        routePath: fixture.routePath,
        status: 200,
        html: fixture.html,
      }),
    ])
  );
  return collectNoJsRegressionIssues(routeChecks);
}

describe("user-testing-audit no-JS flow (e2e-style)", () => {
  it("catches booking-funnel and CTA regressions in a full route matrix", () => {
    const issues = runNoJsAuditFlow([
      {
        routeKey: "home",
        routePath: "/en",
        html: `
          <html><body>
            <h1>Home</h1>
            locationSection.mapLabel
            <button type="button">Check availability</button>
          </body></html>
        `,
      },
      {
        routeKey: "rooms",
        routePath: "/en/rooms",
        html: "<html><body>BAILOUT_TO_CLIENT_SIDE_RENDERING</body></html>",
      },
      {
        routeKey: "roomDetail",
        routePath: "/en/rooms/double_room",
        html: "<html><body><h1>Room</h1>roomImage.photoAlt loadingPrice</body></html>",
      },
      {
        routeKey: "experiences",
        routePath: "/en/experiences",
        html: `
          <html><body>
            BAILOUT_TO_CLIENT_SIDE_RENDERING
            <a href="/en/experiences/path-of-the-gods"><img alt="Path of the Gods" /></a>
          </body></html>
        `,
      },
      {
        routeKey: "howToGetHere",
        routePath: "/en/how-to-get-here",
        html: "<html><body>BAILOUT_TO_CLIENT_SIDE_RENDERING filters.resultsCount</body></html>",
      },
      {
        routeKey: "deals",
        routePath: "/en/deals",
        html: `
          <html>
            <head><title>Save 15% today</title></head>
            <body>No current deals.</body>
          </html>
        `,
      },
    ]);

    const issueIds = issues.map((issue: { id: string }) => issue.id);
    expect(issueIds).toEqual(
      expect.arrayContaining([
        "no-js-route-shell-bailout",
        "no-js-booking-funnel-key-leakage",
        "booking-cta-no-js-fallback",
        "booking-cta-visible-label-missing",
        "experiences-guide-text-links-missing",
        "room-inventory-crawlability-missing",
        "contact-email-mailto-missing",
        "social-links-accessible-name-missing",
      ])
    );
  });

  it("passes cleanly after route HTML is fixed", () => {
    const issues = runNoJsAuditFlow([
      {
        routeKey: "home",
        routePath: "/en",
        html: `
          <html><body>
            <h1>Hostel Brikette</h1>
            As of November 2025
            <a href="mailto:hostelpositano@gmail.com">hostelpositano@gmail.com</a>
            <a href="https://instagram.com/brikette" aria-label="Instagram"><svg aria-hidden="true"></svg></a>
            <a href="/en/book">Check availability</a>
            <a href="/en/book">Book Now</a>
          </body></html>
        `,
      },
      {
        routeKey: "rooms",
        routePath: "/en/rooms",
        html: `
          <html><body>
            <h1>Rooms</h1>
            <a href="/en/book">Check availability</a>
            <a href="/en/book">Book Now</a>
            <a href="/en/rooms/double_room">Double Room</a>
            <script type="application/ld+json">{"@type":"OfferCatalog","name":"Rooms & Rates"}</script>
          </body></html>
        `,
      },
      {
        routeKey: "roomDetail",
        routePath: "/en/rooms/double_room",
        html: `
          <html><body>
            <h1>Double Room</h1>
            <a href="https://book.example">Book Now</a>
            <p>Private double room with ensuite bathroom and sea-view terrace access.</p>
            <script type="application/ld+json">{"@type":"HotelRoom","name":"Double Room"}</script>
          </body></html>
        `,
      },
      {
        routeKey: "experiences",
        routePath: "/en/experiences",
        html: `
          <html><body>
            <h1>Experiences</h1>
            <a href="/en/book">Book Now</a>
            <a href="/en/experiences/path-of-the-gods">Path of the Gods</a>
          </body></html>
        `,
      },
      {
        routeKey: "howToGetHere",
        routePath: "/en/how-to-get-here",
        html: '<html><body><h1>How to Get Here</h1><a href="/en/book">Book Now</a></body></html>',
      },
      {
        routeKey: "deals",
        routePath: "/en/deals",
        html: "<html><head><title>Deals & Offers</title></head><body><h1>Deals & Offers</h1></body></html>",
      },
    ]);

    expect(issues).toHaveLength(0);
  });
});
