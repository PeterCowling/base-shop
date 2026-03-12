import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import { BASE_URL } from "@/config/site";

jest.mock("server-only", () => ({}));

const getJsonLd = (container: HTMLElement): Record<string, unknown> => {
  const script = container.querySelector('script[type="application/ld+json"]');
  if (!script) {
    throw new Error("Missing JSON-LD script");
  }
  return JSON.parse(script.innerHTML) as Record<string, unknown>;
};

describe("PrivateAccomStructuredDataRsc", () => {
  it("emits chooser schema instead of apartment schema for the private booking hub", async () => {
    const pageUrl = `${BASE_URL}/en/book-private-accommodations`;
    const { default: PrivateAccomStructuredDataRsc } = await import("@/components/seo/PrivateAccomStructuredDataRsc");
    const jsx = PrivateAccomStructuredDataRsc({
      lang: "en",
      pageTitle: "Private Rooms",
      pageUrl,
      options: [
        { name: "Double Room", url: `${BASE_URL}/en/private-rooms/double-room` },
        { name: "Sea View Apartment", url: `${BASE_URL}/en/private-rooms/sea-view-apartment` },
      ],
    });
    const { container } = render(jsx);

    const json = getJsonLd(container);
    const graph = json["@graph"] as Array<Record<string, unknown>>;

    expect(graph.some((node) => node["@type"] === "CollectionPage")).toBe(true);
    expect(graph.some((node) => node["@type"] === "ItemList")).toBe(true);
    expect(graph.some((node) => node["@type"] === "Apartment")).toBe(false);

    const breadcrumb = graph.find((node) => node["@type"] === "BreadcrumbList");
    expect(breadcrumb).toBeDefined();

    const breadcrumbItems = (breadcrumb?.itemListElement as Array<Record<string, unknown>>) ?? [];
    expect(breadcrumbItems[1]).toEqual(
      expect.objectContaining({
        position: 2,
        item: pageUrl,
        name: "Private Rooms",
      }),
    );
  });
});
