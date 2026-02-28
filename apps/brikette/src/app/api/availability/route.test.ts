// apps/brikette/src/app/api/availability/route.test.ts
// Unit tests for the Octobook availability proxy route.
// Mock config-env so feature flag can be toggled per test.
// Mock fetch globally to avoid network calls.

// jest.mock for @/config/env is handled by jest.config.cjs → config-env mock.
// Individual tests that need the flag ON use jest.resetModules + require.

import type { AvailabilityRouteResponse, OctorateRoom } from "./route";

// ---------------------------------------------------------------------------
// HTML Fixtures
// ---------------------------------------------------------------------------

/** One available room + one sold-out room, 2-night stay */
const FIXTURE_TWO_ROOMS_HTML = `
<html>
<body>
<div id="reservation-result">
<section class="room animatedParent animateOnce" id="section-dorm">
  <h1 class="animated fadeInDownShort" data-id="7">Dorm</h1>
  <div class="offert">
    Price from €189 ,98 Tourist Tax 5.00 EUR 2 Nights 1 Adult
    <div class="options">
      <div><h4>Non-Refundable</h4></div>
      <div><h4>Flexible</h4></div>
    </div>
  </div>
</section>
<section class="room animatedParent animateOnce" id="section-double">
  <h1 class="animated fadeInDownShort" data-id="10">Double</h1>
  <div class="offert">
    Not available No availability
  </div>
</section>
</div>
</body>
</html>
`;

/** Single available room, 1-night stay, &euro; HTML entity price */
const FIXTURE_EURO_ENTITY_HTML = `
<html><body>
<section class="room animatedParent animateOnce">
  <h1 class="animated fadeInDownShort" data-id="3">Value Dorm</h1>
  <div class="offert">
    Price from &euro;95,00 Tourist Tax 3.00 EUR 1 Night 1 Adult
    <div class="options"><div><h4>Non-Refundable</h4></div></div>
  </div>
</section>
</body></html>
`;

/** Empty response — no room sections */
const FIXTURE_EMPTY_HTML = `<html><body><div id="reservation-result"></div></body></html>`;

// ---------------------------------------------------------------------------
// Helper: build a minimal Request object
// ---------------------------------------------------------------------------
function makeRequest(url: string): Request {
  return new Request(url);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// The config-env mock always sets OCTORATE_LIVE_AVAILABILITY = false.
// Most route tests need the flag ON; we use jest.resetModules + require for those.

describe("GET /api/availability", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch").mockImplementation(
      async (_url: RequestInfo | URL, _init?: RequestInit) => {
        return new Response(FIXTURE_TWO_ROOMS_HTML, { status: 200 });
      }
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.resetModules();
  });

  // TC-01-01: Feature flag disabled → fast path, no fetch call
  it("TC-01-01: returns empty rooms immediately when feature flag is off", async () => {
    // Config-env mock has OCTORATE_LIVE_AVAILABILITY = false by default
    const { GET } = await import("./route");
    const req = makeRequest("https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1");
    const res = await GET(req);
    const body = (await res.json()) as AvailabilityRouteResponse;

    expect(res.status).toBe(200);
    expect(body.rooms).toEqual([]);
    expect(body.fetchedAt).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // For all remaining tests we need flag ON — use a locally-scoped module with overridden env mock.
  describe("with feature flag enabled", () => {
    type RouteModule = typeof import("./route");
    let GET: RouteModule["GET"];

    beforeEach(async () => {
      jest.resetModules();
      // Override the config-env mock to return OCTORATE_LIVE_AVAILABILITY = true
      jest.mock("@/config/env", () => ({
        ...jest.requireActual<typeof import("@/test/__mocks__/config-env")>(
          "@/test/__mocks__/config-env"
        ),
        OCTORATE_LIVE_AVAILABILITY: true,
      }));
      const mod = await import("./route") as RouteModule;
      GET = mod.GET;
    });

    // TC-01-02: Valid params → returns parsed rooms from mocked Octobook HTML
    it("TC-01-02: returns parsed room data on valid request", async () => {
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;
      const doubleRoom = body.rooms.find((r: OctorateRoom) => r.octorateRoomName === "Double");

      expect(res.status).toBe(200);
      expect(body.rooms.length).toBe(2);
      expect(doubleRoom!.octorateRoomId).toBe("10");
      expect(body.fetchedAt).toBeTruthy();
    });

    // TC-01-03: Available room parsed correctly
    it("TC-01-03: parses available room name and available=true", async () => {
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;

      const dorm = body.rooms.find((r: OctorateRoom) => r.octorateRoomName === "Dorm");
      expect(dorm).toBeDefined();
      expect(dorm!.octorateRoomId).toBe("7");
      expect(dorm!.available).toBe(true);
    });

    // TC-01-04: Sold-out room → available=false, priceFrom=null
    it("TC-01-04: parses sold-out room as available=false, priceFrom=null", async () => {
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;

      const doubleRoom = body.rooms.find((r: OctorateRoom) => r.octorateRoomName === "Double");
      expect(doubleRoom).toBeDefined();
      expect(doubleRoom!.octorateRoomId).toBe("10");
      expect(doubleRoom!.available).toBe(false);
      expect(doubleRoom!.priceFrom).toBeNull();
      expect(doubleRoom!.ratePlans).toEqual([]);
    });

    // TC-06-04: Price string parsing "189 ,98" / 2 nights → priceFrom: 94.99
    it("TC-06-04: parses price with space-before-comma format (189 ,98) → priceFrom=94.99 for 2 nights", async () => {
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;

      const dorm = body.rooms.find((r: OctorateRoom) => r.octorateRoomName === "Dorm");
      // 189.98 / 2 nights = 94.99
      expect(dorm!.priceFrom).toBe(94.99);
      expect(dorm!.nights).toBe(2);
    });

    // TC-01-05: Rate plans parsed from h4 elements
    it("TC-01-05: parses rate plan labels from h4 elements", async () => {
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;

      const dorm = body.rooms.find((r: OctorateRoom) => r.octorateRoomName === "Dorm");
      expect(dorm!.ratePlans).toEqual([
        { label: "Non-Refundable" },
        { label: "Flexible" },
      ]);
    });

    // TC-01-06: &euro; entity in price → normalised correctly
    it("TC-01-06: normalises &euro; HTML entity in price string", async () => {
      fetchSpy.mockImplementation(async () =>
        new Response(FIXTURE_EURO_ENTITY_HTML, { status: 200 })
      );
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-02&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;

      const room = body.rooms[0];
      expect(room.octorateRoomId).toBe("3");
      // 95.00 / 1 night = 95.00
      expect(room.priceFrom).toBe(95);
      expect(room.available).toBe(true);
    });

    // TC-01-07: Missing checkin or checkout → 400 with error: "missing_params"
    it("TC-01-07: returns 400 when checkin is missing", async () => {
      const req = makeRequest("https://hostel.test/api/availability?checkout=2026-06-03&pax=1");
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("missing_params");
    });

    it("TC-01-07b: returns 400 when checkout is missing", async () => {
      const req = makeRequest("https://hostel.test/api/availability?checkin=2026-06-01&pax=1");
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("missing_params");
    });

    // TC-01-08: Octobook returns non-200 → upstream_error, empty rooms, HTTP 200
    it("TC-01-08: returns upstream_error on Octobook non-200 response", async () => {
      // Route intentionally calls console.error on upstream failure — suppress for this test.
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
      fetchSpy.mockImplementation(async () => new Response("", { status: 503 }));
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;
      consoleSpy.mockRestore();

      expect(res.status).toBe(200);
      expect(body.rooms).toEqual([]);
      expect(body.error).toBe("upstream_error");
    });

    // TC-01-09: Network error → upstream_error, empty rooms, HTTP 200
    it("TC-01-09: returns upstream_error on Octobook network failure", async () => {
      // Route intentionally calls console.error on network failure — suppress for this test.
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
      fetchSpy.mockImplementation(async () => {
        throw new Error("network error");
      });
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;
      consoleSpy.mockRestore();

      expect(res.status).toBe(200);
      expect(body.rooms).toEqual([]);
      expect(body.error).toBe("upstream_error");
    });

    // TC-01-10: Empty HTML (no room sections) → rooms: []
    it("TC-01-10: returns empty rooms array when no room sections found in HTML", async () => {
      fetchSpy.mockImplementation(async () =>
        new Response(FIXTURE_EMPTY_HTML, { status: 200 })
      );
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;

      expect(res.status).toBe(200);
      expect(body.rooms).toEqual([]);
    });

    // TC-06-05: Sold-out HTML fixture → available=false, priceFrom=null
    it("TC-06-05: sold-out section with No availability text → available=false, priceFrom=null", async () => {
      const soldOutOnlyHtml = `
        <html><body>
        <section class="room animatedParent animateOnce">
          <h1 class="animated fadeInDownShort" data-id="10">Double</h1>
          <div class="offert">Not available No availability</div>
        </section>
        </body></html>
      `;
      fetchSpy.mockImplementation(async () =>
        new Response(soldOutOnlyHtml, { status: 200 })
      );
      const req = makeRequest(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1"
      );
      const res = await GET(req);
      const body = (await res.json()) as AvailabilityRouteResponse;

      expect(body.rooms.length).toBe(1);
      expect(body.rooms[0].available).toBe(false);
      expect(body.rooms[0].priceFrom).toBeNull();
    });
  });
});
