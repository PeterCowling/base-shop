// apps/brikette/src/test/components/book-page-structured-data.test.tsx
/* -------------------------------------------------------------------------- */
/* TC-01: Book page renders Hostel JSON-LD with required fields              */
/* TC-02: No i18n key leakage on /[lang]/book for non-EN locales             */
/* -------------------------------------------------------------------------- */

import "@testing-library/jest-dom";

import { Suspense } from "react";
import { render } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/en/book",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: (namespace: string) => ({
    t: (key: string, options?: { defaultValue?: string | string[]; returnObjects?: boolean }) => {
      if (namespace === "bookPage") {
        const bookPageKeys: Record<string, string> = {
          "heading": "Book your stay",
          "subheading": "Choose your dates, then pick a room.",
          "date.checkIn": "Check in",
          "date.checkOut": "Check out",
          "date.guests": "Guests",
          "date.apply": "Update",
        };
        return bookPageKeys[key] ?? options?.defaultValue ?? key;
      }
      if (namespace === "modals") {
        if (key === "directPerks.heading") return "Why book direct?";
        if (key === "directPerks.items") {
          return options?.returnObjects
            ? ["Up to 25% off", "Complimentary breakfast", "Complimentary evening drink"]
            : [];
        }
      }
      return options?.defaultValue ?? key;
    },
    i18n: {
      language: "en",
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock hooks
jest.mock("@/hooks/usePagePreload", () => ({
  usePagePreload: () => null,
}));

jest.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

// eslint-disable-next-line import/first -- mocks must be declared before imports
import BookStructuredData from "@/components/seo/BookStructuredData";

describe("Book Page Structured Data", () => {
  describe("TC-01: Hostel JSON-LD with required fields, no aggregateRating", () => {
    it("should render valid Hostel JSON-LD with required fields and no third-party aggregateRating", () => {
      const { container } = render(
        <Suspense fallback={null}>
          <BookStructuredData lang="en" />
        </Suspense>
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeInTheDocument();

      const jsonLd = JSON.parse(script!.textContent!);

      // Verify @type is Hostel
      expect(jsonLd["@type"]).toBe("Hostel");

      // Assert required core fields present
      expect(jsonLd).toHaveProperty("@context");
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd).toHaveProperty("@id");
      expect(jsonLd).toHaveProperty("name");
      expect(jsonLd).toHaveProperty("description");
      expect(jsonLd).toHaveProperty("url");
      expect(jsonLd).toHaveProperty("mainEntityOfPage");

      // Assert contact & location fields
      expect(jsonLd).toHaveProperty("address");
      expect(jsonLd.address["@type"]).toBe("PostalAddress");
      expect(jsonLd).toHaveProperty("geo");
      expect(jsonLd.geo["@type"]).toBe("GeoCoordinates");
      expect(jsonLd).toHaveProperty("hasMap");

      // Assert booking-critical fields
      expect(jsonLd).toHaveProperty("priceRange");
      expect(jsonLd).toHaveProperty("checkinTime");
      expect(jsonLd).toHaveProperty("checkoutTime");
      expect(jsonLd).toHaveProperty("availableLanguage");
      expect(Array.isArray(jsonLd.availableLanguage)).toBe(true);

      // Assert amenities
      expect(jsonLd).toHaveProperty("amenityFeature");
      expect(Array.isArray(jsonLd.amenityFeature)).toBe(true);

      // Assert business hours
      expect(jsonLd).toHaveProperty("openingHoursSpecification");
      expect(Array.isArray(jsonLd.openingHoursSpecification)).toBe(true);

      // CRITICAL: Assert NO third-party ratings
      expect(jsonLd).not.toHaveProperty("aggregateRating");
      expect(jsonLd).not.toHaveProperty("review");

      // Snapshot for stability
      expect(jsonLd).toMatchSnapshot();
    });
  });

  describe("TC-02: No i18n key leakage for non-EN locales", () => {
    it("should not leak i18n keys for German (de) locale", () => {
      const { container } = render(
        <Suspense fallback={null}>
          <BookStructuredData lang="de" />
        </Suspense>
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.textContent!);

      // Check description doesn't contain i18n placeholder patterns
      expect(jsonLd.description).not.toMatch(/\{\{.*\}\}/);
      expect(jsonLd.description).not.toMatch(/\$t\(/);
      expect(jsonLd.name).not.toMatch(/\{\{.*\}\}/);
    });

    it("should not leak i18n keys for Spanish (es) locale", () => {
      const { container } = render(
        <Suspense fallback={null}>
          <BookStructuredData lang="es" />
        </Suspense>
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.textContent!);

      expect(jsonLd.description).not.toMatch(/\{\{.*\}\}/);
      expect(jsonLd.description).not.toMatch(/\$t\(/);
      expect(jsonLd.name).not.toMatch(/\{\{.*\}\}/);
    });

    it("should not leak i18n keys for French (fr) locale", () => {
      const { container } = render(
        <Suspense fallback={null}>
          <BookStructuredData lang="fr" />
        </Suspense>
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.textContent!);

      expect(jsonLd.description).not.toMatch(/\{\{.*\}\}/);
      expect(jsonLd.description).not.toMatch(/\$t\(/);
      expect(jsonLd.name).not.toMatch(/\{\{.*\}\}/);
    });
  });
});
