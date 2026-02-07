import "@testing-library/jest-dom";

import { pickBestLink, scoreTransportMode } from "@/routes/how-to-get-here/pickBestLink";
import type { AugmentedDestinationLink } from "@/routes/how-to-get-here/types";

describe("scoreTransportMode", () => {
  it("returns 0 for car when preference is fastest", () => {
    expect(scoreTransportMode("car", "fastest")).toBe(0);
  });

  it("returns 0 for walk when preference is cheapest", () => {
    expect(scoreTransportMode("walk", "cheapest")).toBe(0);
  });

  it("prefers bus over ferry for cheapest", () => {
    expect(scoreTransportMode("bus", "cheapest")).toBeLessThan(
      scoreTransportMode("ferry", "cheapest")
    );
  });

  it("returns 0 for null preference (no preference)", () => {
    expect(scoreTransportMode("bus", null)).toBe(0);
    expect(scoreTransportMode("ferry", null)).toBe(0);
  });
});

describe("pickBestLink", () => {
  const createLink = (
    overrides: Partial<AugmentedDestinationLink>
  ): AugmentedDestinationLink => ({
    href: "test-route",
    label: "Test Route",
    direction: "to",
    transportModes: ["bus"],
    internal: true,
    ...overrides,
  });

  it("returns null for empty links array", () => {
    const result = pickBestLink([], {
      placeId: "naples",
      arrival: "daytime",
      preference: null,
    });
    expect(result).toBeNull();
  });

  it("prefers 'to' direction routes over 'from' direction", () => {
    const toRoute = createLink({ href: "to-route", direction: "to" });
    const fromRoute = createLink({ href: "from-route", direction: "from" });

    const result = pickBestLink([fromRoute, toRoute], {
      placeId: "naples",
      arrival: "daytime",
      preference: null,
    });

    expect(result?.href).toBe("to-route");
  });

  it("falls back to 'from' routes when no 'to' routes exist", () => {
    const fromRoute = createLink({ href: "from-route", direction: "from" });

    const result = pickBestLink([fromRoute], {
      placeId: "naples",
      arrival: "daytime",
      preference: null,
    });

    expect(result?.href).toBe("from-route");
  });

  it("penalizes ferry routes for late-night arrivals", () => {
    const busRoute = createLink({
      href: "bus-route",
      transportModes: ["bus"],
    });
    const ferryRoute = createLink({
      href: "ferry-route",
      transportModes: ["ferry"],
    });

    const result = pickBestLink([ferryRoute, busRoute], {
      placeId: "naples",
      arrival: "late-night",
      preference: null,
    });

    // Bus should be picked because ferry has late-night penalty
    expect(result?.href).toBe("bus-route");
  });

  it("does not penalize ferry for daytime arrivals", () => {
    const busRoute = createLink({
      href: "bus-route",
      transportModes: ["bus"],
    });
    const ferryRoute = createLink({
      href: "ferry-route",
      transportModes: ["ferry"],
    });

    const result = pickBestLink([busRoute, ferryRoute], {
      placeId: "naples",
      arrival: "daytime",
      preference: "fastest",
    });

    // Ferry should be picked because it's faster than bus
    expect(result?.href).toBe("ferry-route");
  });

  it("penalizes routes with multiple transport modes (transfers)", () => {
    const directRoute = createLink({
      href: "direct-route",
      transportModes: ["bus"],
    });
    const transferRoute = createLink({
      href: "transfer-route",
      transportModes: ["bus", "train"],
    });

    const result = pickBestLink([transferRoute, directRoute], {
      placeId: "naples",
      arrival: "daytime",
      preference: null,
    });

    // Direct route should be picked due to no transfer penalty
    expect(result?.href).toBe("direct-route");
  });

  it("picks car when preference is fastest", () => {
    const carRoute = createLink({
      href: "car-route",
      transportModes: ["car"],
    });
    const busRoute = createLink({
      href: "bus-route",
      transportModes: ["bus"],
    });

    const result = pickBestLink([busRoute, carRoute], {
      placeId: "naples",
      arrival: "daytime",
      preference: "fastest",
    });

    expect(result?.href).toBe("car-route");
  });

  it("picks walk when preference is cheapest", () => {
    const walkRoute = createLink({
      href: "walk-route",
      transportModes: ["walk"],
    });
    const busRoute = createLink({
      href: "bus-route",
      transportModes: ["bus"],
    });

    const result = pickBestLink([busRoute, walkRoute], {
      placeId: "naples",
      arrival: "daytime",
      preference: "cheapest",
    });

    expect(result?.href).toBe("walk-route");
  });
});
