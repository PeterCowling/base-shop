import "@testing-library/jest-dom";

import { renderWithProviders } from "@tests/renderers";

import { buildCanonicalUrl } from "@acme/ui/lib/seo";

import TravelHelpStructuredData from "@/components/seo/TravelHelpStructuredData";
import { BASE_URL } from "@/config/site";
import { guideSlug } from "@/routes.guides-helpers";
import { HOTEL_ID } from "@/utils/schema";
import { getSlug } from "@/utils/slug";

jest.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      options: { fallbackLng: "en" },
      getDataByLanguage: () => ({
        travelHelp: {
          slug: "travel-help",
          headings: {
            laundry: "Where can I do laundry?",
          },
          content: {
            laundry: "Use nearby laundry services.",
          },
        },
      }),
      getFixedT: () => (_key: string, options?: Record<string, unknown>) => {
        if (options && typeof options.defaultValue === "string") {
          return options.defaultValue;
        }
        return "";
      },
    },
  }),
}));

const parseJsonLdScripts = (container: HTMLElement): Array<Record<string, unknown>> =>
  Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map((script) =>
    JSON.parse(script.innerHTML) as Record<string, unknown>,
  );

const hasGraph = (
  payload: Record<string, unknown>,
): payload is Record<string, unknown> & { "@graph": Array<Record<string, unknown>> } =>
  Array.isArray(payload["@graph"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

describe("TravelHelpStructuredData", () => {
  it("applies runtime inLanguage/url overrides and normalizes isLocatedIn ids", () => {
    const { container } = renderWithProviders(<TravelHelpStructuredData />);
    const payloads = parseJsonLdScripts(container);
    const nearbyPayload = payloads.find(hasGraph);

    if (!nearbyPayload) {
      throw new Error("Missing nearby JSON-LD payload");
    }

    const expectedPath = `/en/${getSlug("assistance", "en")}/${guideSlug("en", "travelHelp")}`;
    const expectedUrl = buildCanonicalUrl(BASE_URL, expectedPath);

    expect(nearbyPayload.inLanguage).toBe("en");
    expect(nearbyPayload.url).toBe(expectedUrl);

    const nodesWithLocation = nearbyPayload["@graph"].filter((node) => isRecord(node.isLocatedIn));
    expect(nodesWithLocation.length).toBeGreaterThan(0);

    nodesWithLocation.forEach((node) => {
      const isLocatedIn = node.isLocatedIn as Record<string, unknown>;
      expect(isLocatedIn["@id"]).toBe(HOTEL_ID);
    });
  });
});
