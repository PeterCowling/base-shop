import "@testing-library/jest-dom";

import { renderWithProviders } from "@tests/renderers";

import ApartmentStructuredData from "@/components/seo/ApartmentStructuredData";

const getJsonLd = (container: HTMLElement): Record<string, unknown> => {
  const script = container.querySelector('script[type="application/ld+json"]');
  if (!script) {
    throw new Error("Missing JSON-LD script");
  }

  return JSON.parse(script.innerHTML) as Record<string, unknown>;
};

describe("ApartmentStructuredData", () => {
  it("renders apartment JSON-LD from the schema module", () => {
    const { container } = renderWithProviders(<ApartmentStructuredData />);
    const json = getJsonLd(container);

    expect(json["@type"]).toBe("Apartment");
    expect(json.name).toBe("StepFree Chiesa Nuova — Private Apartment in Positano");

    const occupancy = json.occupancy as Record<string, unknown>;
    expect(occupancy.value).toBe(4);
  });
});
