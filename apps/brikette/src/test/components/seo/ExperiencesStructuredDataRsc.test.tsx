import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";

// Mock server-only guard so Jest can import the RSC component
jest.mock("server-only", () => ({}));

// Mock getTranslations from i18n-server
jest.mock("@/app/_lib/i18n-server", () => ({
  getTranslations: jest.fn(),
}));

// Mock buildCanonicalUrl — pure function, but @acme/ui may not be resolvable in Jest
jest.mock("@acme/ui/lib/seo", () => ({
  buildCanonicalUrl: (baseUrl: string, path: string) => `${baseUrl}${path}`,
}));

/** Create a TFunction-like mock that returns real-looking translated strings. */
const makeTFn = (overrides: Record<string, string> = {}) => {
  return (key: string, opts?: { defaultValue?: string }) => {
    if (key in overrides) return overrides[key];
    return opts?.defaultValue ?? key;
  };
};

/** Create a TFunction that returns i18n key tokens (identity translation — simulates unresolved). */
const makeIdentityTFn = () => (key: string) => key;

/** Create a TFunction that returns empty strings for all keys. */
const makeEmptyTFn = () => (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? "";

const getJsonLd = (container: HTMLElement): Record<string, unknown> => {
  const script = container.querySelector('script[type="application/ld+json"]');
  if (!script) {
    throw new Error("Missing JSON-LD script");
  }
  return JSON.parse(script.innerHTML) as Record<string, unknown>;
};

describe("ExperiencesStructuredDataRsc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: renders ItemList JSON-LD with 3 items (English happy path)", async () => {
    const { getTranslations } = await import("@/app/_lib/i18n-server");
    (getTranslations as jest.Mock).mockResolvedValueOnce(
      makeTFn({
        "meta.title": "Experiences – Terrace Bar, Hikes, Digital Concierge",
        "hero.description": "Pair your stay with terrace drinks and curated hikes.",
        "meta.description": "Explore the terrace bar, local hikes and our digital concierge.",
        "sections.bar.title": "Sunset terrace bar",
        "sections.bar.description": "Clifftop terrace with spritzes and wines.",
        "sections.hikes.title": "Guided hikes & day trips",
        "sections.hikes.description": "Plan Sentiero degli Dei hikes and ferry trips.",
        "sections.concierge.title": "Always-on digital concierge",
        "sections.concierge.description": "Real-time alerts on ferry changes and restaurant openings.",
      })
    );

    const ExperiencesStructuredDataRsc = (await import("@/components/seo/ExperiencesStructuredDataRsc")).default;
    const jsx = await ExperiencesStructuredDataRsc({ lang: "en" });
    expect(jsx).not.toBeNull();

    const { container } = render(jsx!);
    const json = getJsonLd(container);

    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("ItemList");
    expect(json["inLanguage"]).toBe("en");

    const items = json["itemListElement"] as unknown[];
    expect(items).toHaveLength(3);
  });

  it("TC-02: uses SECTION_DEFAULTS when translations return identity keys (fallback path)", async () => {
    const { getTranslations } = await import("@/app/_lib/i18n-server");
    (getTranslations as jest.Mock).mockResolvedValueOnce(makeIdentityTFn());

    const ExperiencesStructuredDataRsc = (await import("@/components/seo/ExperiencesStructuredDataRsc")).default;
    const jsx = await ExperiencesStructuredDataRsc({ lang: "en" });
    expect(jsx).not.toBeNull();

    const { container } = render(jsx!);
    const json = getJsonLd(container);

    const items = json["itemListElement"] as Record<string, unknown>[];
    expect(items).toHaveLength(3);
    // Fallback title for bar section
    expect(items[0]?.name).toBe("Sunset terrace bar");
  });

  it("TC-03: returns null when meta.title resolves to empty and no fallback applies", async () => {
    const { getTranslations } = await import("@/app/_lib/i18n-server");
    // Empty TFunction — all keys return empty string
    (getTranslations as jest.Mock).mockResolvedValueOnce(makeEmptyTFn());

    const ExperiencesStructuredDataRsc = (await import("@/components/seo/ExperiencesStructuredDataRsc")).default;
    const jsx = await ExperiencesStructuredDataRsc({ lang: "en" });

    // When all translations are empty, sections will be empty → returns null
    // Note: FALLBACK_NAME is always available via translateOrFallback, so the null
    // case triggers on sections.length === 0 with treatEmptyAsMissing paths
    // The component returns null only when sections.length === 0 after filtering
    // Since makeEmptyTFn returns "" for all section keys and treatEmptyAsMissing=true,
    // all section title/body computations return "", so null filtering removes all 3.
    expect(jsx).toBeNull();
  });

  it("TC-04: url field matches canonical URL for the locale", async () => {
    const { getTranslations } = await import("@/app/_lib/i18n-server");
    (getTranslations as jest.Mock).mockResolvedValueOnce(makeIdentityTFn());

    const ExperiencesStructuredDataRsc = (await import("@/components/seo/ExperiencesStructuredDataRsc")).default;
    const jsx = await ExperiencesStructuredDataRsc({ lang: "de" });
    expect(jsx).not.toBeNull();

    const { container } = render(jsx!);
    const json = getJsonLd(container);

    const expectedUrl = `${BASE_URL}/de/${getSlug("experiences", "de")}`;
    expect(json["url"]).toBe(expectedUrl);
  });

  it("TC-05: no suppressHydrationWarning on script tag", async () => {
    const { getTranslations } = await import("@/app/_lib/i18n-server");
    (getTranslations as jest.Mock).mockResolvedValueOnce(makeIdentityTFn());

    const ExperiencesStructuredDataRsc = (await import("@/components/seo/ExperiencesStructuredDataRsc")).default;
    const jsx = await ExperiencesStructuredDataRsc({ lang: "en" });
    expect(jsx).not.toBeNull();

    const { container } = render(jsx!);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(script?.hasAttribute("suppresshydrationwarning")).toBe(false);
  });

  it("TC-07: about and isPartOf IDs are present in the JSON-LD", async () => {
    const { getTranslations } = await import("@/app/_lib/i18n-server");
    (getTranslations as jest.Mock).mockResolvedValueOnce(makeIdentityTFn());

    const ExperiencesStructuredDataRsc = (await import("@/components/seo/ExperiencesStructuredDataRsc")).default;
    const jsx = await ExperiencesStructuredDataRsc({ lang: "en" });
    expect(jsx).not.toBeNull();

    const { container } = render(jsx!);
    const json = getJsonLd(container);

    expect(json["about"]).toBeDefined();
    expect(json["isPartOf"]).toBeDefined();
  });
});
