import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

// Mock server-only guard so Jest can import the RSC component
jest.mock("server-only", () => ({}));

// Mock loadRoomsCatalog — async, returns deterministic room data
jest.mock("@/utils/roomsCatalog", () => ({
  loadRoomsCatalog: jest.fn().mockResolvedValue([
    {
      sku: "room-dorm-6",
      title: "6-Bed Mixed Dorm",
      description: "Comfortable 6-bed dorm with sea view.",
      basePrice: { amount: 35, currency: "EUR" },
      occupancy: 6,
      amenities: [{ name: "Locker" }, { name: "Fan" }],
      imagesRaw: ["/img/dorm-6.jpg"],
      seasonalPrices: [{ start: "2024-06-01", end: "2024-09-30", amount: 45 }],
    },
    {
      sku: "room-private-twin",
      title: "Private Twin Room",
      description: "Private twin room with terrace access.",
      basePrice: { amount: 95, currency: "EUR" },
      occupancy: 2,
      amenities: [{ name: "AC" }],
      imagesRaw: ["/img/twin.jpg"],
      seasonalPrices: [],
    },
  ]),
}));

const getJsonLd = (container: HTMLElement): Record<string, unknown> => {
  const script = container.querySelector('script[type="application/ld+json"]');
  if (!script) {
    throw new Error("Missing JSON-LD script");
  }
  return JSON.parse(script.innerHTML) as Record<string, unknown>;
};

describe("RoomsStructuredDataRsc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: renders OfferCatalog JSON-LD with correct context and type (English)", async () => {
    // Async RSC pattern: await the component function, then render the resolved JSX
    const RoomsStructuredDataRsc = (await import("@/components/seo/RoomsStructuredDataRsc")).default;
    const jsx = await RoomsStructuredDataRsc({ lang: "en" });
    const { container } = render(jsx);

    const json = getJsonLd(container);
    expect(json["@context"]).toBe("https://schema.org");

    const graph = json["@graph"] as Record<string, unknown>[];
    expect(Array.isArray(graph)).toBe(true);

    const catalog = graph.find((node) => node["@type"] === "OfferCatalog");
    expect(catalog).toBeDefined();
    expect((catalog as Record<string, unknown>)["numberOfItems"]).toBe(2);
  });

  it("TC-02: renders with inLanguage: de for German locale", async () => {
    const RoomsStructuredDataRsc = (await import("@/components/seo/RoomsStructuredDataRsc")).default;
    const jsx = await RoomsStructuredDataRsc({ lang: "de" });
    const { container } = render(jsx);

    const json = getJsonLd(container);
    const graph = json["@graph"] as Record<string, unknown>[];

    const catalog = graph.find((node) => node["@type"] === "OfferCatalog");
    expect(catalog).toBeDefined();
    expect((catalog as Record<string, unknown>)["inLanguage"]).toBe("de");
  });

  it("TC-02b: includes HotelRoom nodes", async () => {
    const RoomsStructuredDataRsc = (await import("@/components/seo/RoomsStructuredDataRsc")).default;
    const jsx = await RoomsStructuredDataRsc({ lang: "en" });
    const { container } = render(jsx);

    const json = getJsonLd(container);
    const graph = json["@graph"] as Record<string, unknown>[];
    const hotelRooms = graph.filter((node) => node["@type"] === "HotelRoom");
    expect(hotelRooms).toHaveLength(2);
  });

  it("TC-03: emits empty catalog (numberOfItems: 0) when no rooms returned", async () => {
    const { loadRoomsCatalog } = await import("@/utils/roomsCatalog");
    (loadRoomsCatalog as jest.Mock).mockResolvedValueOnce([]);

    const RoomsStructuredDataRsc = (await import("@/components/seo/RoomsStructuredDataRsc")).default;
    const jsx = await RoomsStructuredDataRsc({ lang: "en" });
    const { container } = render(jsx);

    const json = getJsonLd(container);
    const graph = json["@graph"] as Record<string, unknown>[];
    const catalog = graph.find((node) => node["@type"] === "OfferCatalog");
    expect(catalog).toBeDefined();
    expect((catalog as Record<string, unknown>)["numberOfItems"]).toBe(0);
  });

  it("TC-03b: no suppressHydrationWarning on script tag", async () => {
    const RoomsStructuredDataRsc = (await import("@/components/seo/RoomsStructuredDataRsc")).default;
    const jsx = await RoomsStructuredDataRsc({ lang: "en" });
    const { container } = render(jsx);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeDefined();
    expect(script?.hasAttribute("suppresshydrationwarning")).toBe(false);
  });

  it("TC-04b: pageUrl uses correct localized rooms slug", async () => {
    const RoomsStructuredDataRsc = (await import("@/components/seo/RoomsStructuredDataRsc")).default;
    const jsx = await RoomsStructuredDataRsc({ lang: "de" });
    const { container } = render(jsx);

    const json = getJsonLd(container);
    const graph = json["@graph"] as Record<string, unknown>[];
    const catalog = graph.find((node) => node["@type"] === "OfferCatalog") as Record<string, unknown>;
    const expectedUrl = `${BASE_URL}/de/${getSlug("rooms", "de")}`;
    expect(catalog["url"]).toBe(expectedUrl);
  });
});
