// apps/brikette/src/app/_api-off/availability/route.test.ts
// Coverage for the live Cloudflare Pages Function contract at functions/api/availability.js.

import {
  onRequestGet,
  onRequestHead,
} from "../../../../functions/api/availability.js";

const FIXTURE_TWO_ROOMS_HTML = `
<html>
<body>
<div id="reservation-result">
<section class="room animatedParent animateOnce" id="section-dorm">
  <h1 class="animated fadeInDownShort" data-id="3">Dorm</h1>
  <div class="offert">
    Price from €189 ,98 Tourist Tax 5.00 EUR 2 Nights 1 Adult
    <div class="options">
      <div><h4>Non-Refundable</h4></div>
      <div><h4>Flexible</h4></div>
    </div>
  </div>
</section>
<section class="room animatedParent animateOnce" id="section-double">
  <h1 class="animated fadeInDownShort" data-id="3">Double</h1>
  <div class="offert">
    Not available No availability
  </div>
</section>
</div>
</body>
</html>
`;

const FIXTURE_EMPTY_HTML = `<html><body><div id="reservation-result"></div></body></html>`;

function makeContext(url: string, env: Record<string, string> = {}): {
  env: Record<string, string>;
  request: Request;
} {
  return {
    request: new Request(url),
    env,
  };
}

describe("Pages Function /api/availability", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async () =>
      new Response(FIXTURE_TWO_ROOMS_HTML, { status: 200 }),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("returns 200 with empty rooms when live availability is disabled", async () => {
    const response = await onRequestGet(
      makeContext(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1",
      ),
    );
    const body = (await response.json()) as { fetchedAt: string; rooms: unknown[] };

    expect(response.status).toBe(200);
    expect(body.rooms).toEqual([]);
    expect(body.fetchedAt).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns parsed room data when live availability is enabled", async () => {
    const response = await onRequestGet(
      makeContext(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1",
        { NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY: "1" },
      ),
    );
    const body = (await response.json()) as {
      fetchedAt: string;
      rooms: Array<{
        available: boolean;
        nights: number;
        octorateRoomId: string;
        octorateRoomName: string;
        priceFrom: number | null;
        ratePlans: Array<{ label: string }>;
      }>;
    };

    expect(response.status).toBe(200);
    expect(body.fetchedAt).toBeTruthy();
    expect(body.rooms).toHaveLength(2);
    expect(body.rooms[0]).toMatchObject({
      octorateRoomName: "Dorm",
      octorateRoomId: "3",
      available: true,
      nights: 2,
      priceFrom: 94.99,
      ratePlans: [{ label: "Non-Refundable" }, { label: "Flexible" }],
    });
    expect(body.rooms[1]).toMatchObject({
      octorateRoomName: "Double",
      available: false,
      priceFrom: null,
      ratePlans: [],
    });
  });

  it("returns 400 for invalid date params", async () => {
    const response = await onRequestGet(
      makeContext(
        "https://hostel.test/api/availability?checkin=2026-06-02&checkout=2026-06-01&pax=1",
        { NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY: "1" },
      ),
    );
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_range");
  });

  it("returns 400 when required params are missing", async () => {
    const response = await onRequestGet(
      makeContext("https://hostel.test/api/availability?checkout=2026-06-03&pax=1", {
        NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY: "1",
      }),
    );
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe("missing_params");
  });

  it("maps upstream non-OK responses to upstream_error with HTTP 200", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    fetchSpy.mockImplementation(async () => new Response("", { status: 503 }));

    const response = await onRequestGet(
      makeContext(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1",
        { NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY: "1" },
      ),
    );
    const body = (await response.json()) as { error?: string; rooms: unknown[] };

    expect(response.status).toBe(200);
    expect(body.rooms).toEqual([]);
    expect(body.error).toBe("upstream_error");
    consoleSpy.mockRestore();
  });

  it("returns 200 HEAD with the live allow header", async () => {
    const response = onRequestHead();

    expect(response.status).toBe(200);
    expect(response.headers.get("Allow")).toBe("GET, HEAD");
    expect(await response.text()).toBe("");
  });

  it("returns 200 with empty rooms when Octobook HTML contains no room sections", async () => {
    fetchSpy.mockImplementation(async () => new Response(FIXTURE_EMPTY_HTML, { status: 200 }));

    const response = await onRequestGet(
      makeContext(
        "https://hostel.test/api/availability?checkin=2026-06-01&checkout=2026-06-03&pax=1",
        { NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY: "1" },
      ),
    );
    const body = (await response.json()) as { rooms: unknown[] };

    expect(response.status).toBe(200);
    expect(body.rooms).toEqual([]);
  });
});
