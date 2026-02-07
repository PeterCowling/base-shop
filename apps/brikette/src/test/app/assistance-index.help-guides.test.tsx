import "@testing-library/jest-dom";

import React from "react";
import { screen, within } from "@testing-library/react";

import AssistanceIndexContent from "@/app/[lang]/assistance/AssistanceIndexContent";
import type { GuideKey } from "@/guides/slugs";
import { renderWithProviders } from "@tests/renderers";

jest.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => undefined,
}));

jest.mock("@/components/assistance/quick-links-section", () => ({
  __esModule: true,
  default: () => (
    <section>
      <h2>Quick help</h2>
    </section>
  ),
}));

jest.mock("@/components/seo/FaqStructuredData", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/lib/guides/guideCardImage", () => ({
  resolveGuideCardImage: (key: string) => ({ src: `/img/mock/${key}.jpg`, alt: `${key} card image` }),
}));

jest.mock("react-i18next", () => {
  const i18nStub = {
    language: "en",
    getFixedT: () => (key: string, opts?: { defaultValue?: string; returnObjects?: boolean }) => {
      if (opts?.returnObjects) return undefined;
      if (key === "labels.helpfulGuides") return "Helpful Guides";
      if (key === "content.ageAccessibility.linkLabel") return "Age and accessibility";
      if (key === "content.bookingBasics.linkLabel") return "Booking basics";
      if (key === "content.defectsDamages.linkLabel") return "Defects and damages";
      if (key === "content.depositsPayments.linkLabel") return "Deposits and payment";
      if (key === "content.security.linkLabel") return "Safety and security";
      if (key === "content.travelHelp.linkLabel") return "Travel help";
      if (key === "content.simsAtms.linkLabel") return "SIMs, eSIMs, and ATMs";
      if (key === "content.whatToPack.linkLabel") return "What to pack";
      if (key === "content.bestTimeToVisit.linkLabel") return "Best time to visit";

      if (key === "content.naplesAirportPositanoBus.linkLabel") return "Naples airport → Positano by bus";
      if (key === "content.positanoNaplesCenterBusTrain.linkLabel") return "Positano ↔ Naples (bus + train)";
      if (key === "content.ferryDockToBrikette.linkLabel") return "Ferry dock → Hostel Brikette";
      if (key === "content.chiesaNuovaArrivals.linkLabel") return "Chiesa Nuova arrivals";
      if (key === "content.pathOfTheGods.linkLabel") return "Path of the Gods";
      if (key === "content.cheapEats.linkLabel") return "Cheap eats in Positano";
      if (key === "content.dayTripsAmalfi.linkLabel") return "Day trips from Positano";
      if (key === "content.positanoBeaches.linkLabel") return "Positano beaches";
      if (typeof opts?.defaultValue === "string") return opts.defaultValue;
      return key;
    },
  } as const;

  return {
    useTranslation: (namespace: string) => {
      if (namespace === "guides") {
        return {
          t: i18nStub.getFixedT(),
          i18n: i18nStub,
        };
      }

      return {
        t: (key: string, opts?: { defaultValue?: string; returnObjects?: boolean }) => {
          if (opts?.returnObjects) return {};
          if (key === "popularGuides") return "Other Popular Guides";
          if (key === "cta.readMore") return "Read more";
          if (typeof opts?.defaultValue === "string") return opts.defaultValue;
          return key;
        },
        i18n: i18nStub,
        ready: true,
      };
    },
  };
});

describe("/help assistance index", () => {
  it("shows Quick help above Help guides", () => {
    renderWithProviders(<AssistanceIndexContent lang="en" />, { route: "/en/help" });

    const quickHelpHeading = screen.getByRole("heading", { name: "Quick help" });
    const helpGuidesHeading = screen.getByRole("heading", { name: "Helpful Guides" });
    expect(quickHelpHeading.compareDocumentPosition(helpGuidesHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders only published guides in the curated Helpful guides list", () => {
    renderWithProviders(<AssistanceIndexContent lang="en" />, { route: "/en/help" });

    const heading = screen.getByRole("heading", { name: "Helpful Guides" });
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    const scoped = within(section as HTMLElement);

    const expected = [
      "SIMs, eSIMs, and ATMs",
      "What to pack",
      "Best time to visit",
    ];
    for (const label of expected) {
      expect(scoped.getByRole("link", { name: label })).toBeInTheDocument();
    }

    const hiddenDraftLabels = [
      "Age and accessibility",
      "Booking basics",
      "Defects and damages",
      "Deposits and payment",
      "Safety and security",
      "Travel help",
    ];
    for (const label of hiddenDraftLabels) {
      expect(scoped.queryByRole("link", { name: label })).not.toBeInTheDocument();
    }
  });

  it("shows Other Popular Guides spanning Experiences and How to Get Here", () => {
    renderWithProviders(<AssistanceIndexContent lang="en" />, { route: "/en/help" });

    const heading = screen.getByRole("heading", { name: "Other Popular Guides" });
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    const scoped = within(section as HTMLElement);

    expect(scoped.getByRole("link", { name: "Naples airport → Positano by bus" })).toBeInTheDocument();
    expect(scoped.getByRole("link", { name: "Path of the Gods" })).toBeInTheDocument();
    expect(scoped.getAllByRole("img")).toHaveLength(8);
  });
});
