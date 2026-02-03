import React from "react";

import HeadSection from "@/routes/guides/guide-seo/components/HeadSection";
import { expectNoHydrationErrors, renderWithHydration } from "@/test/helpers/hydrationTestUtils";

describe("published guide hydration", () => {
  it("does not cause hydration errors for published guide in English", () => {
    const guideKey = "positanoMainBeach" as const;
    const lang = "en" as const;
    const pageTitle = "Positano Main Beach Guide"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const description = "Complete guide to Positano Main Beach"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const previewBannerLabel = "Preview"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const breadcrumb = {
      "@context": "https://schema.org" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org context URL, non-UI
      "@type": "BreadcrumbList" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
      itemListElement: [],
    };

    const sharedProps = {
      lang,
      guideKey,
      search: "", // Published guide, no search params
      pageTitle,
      description,
      previewBannerLabel,
      breadcrumb,
      howToJson: null,
      suppressTwitterCardResolve: true,
    };

    const result = renderWithHydration({
      server: <HeadSection {...sharedProps} />,
      client: <HeadSection {...sharedProps} />,
    });

    expectNoHydrationErrors(result);
  });

  it("does not cause hydration errors for published guide in German", () => {
    const guideKey = "positanoMainBeach" as const;
    const lang = "de" as const;
    const pageTitle = "Positano Hauptstrand Führer"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const description = "Vollständiger Führer zum Positano Hauptstrand"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const previewBannerLabel = "Vorschau"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const breadcrumb = {
      "@context": "https://schema.org" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org context URL, non-UI
      "@type": "BreadcrumbList" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
      itemListElement: [],
    };

    const sharedProps = {
      lang,
      guideKey,
      search: "", // Published guide, no search params
      pageTitle,
      description,
      previewBannerLabel,
      breadcrumb,
      howToJson: null,
      suppressTwitterCardResolve: true,
    };

    const result = renderWithHydration({
      server: <HeadSection {...sharedProps} />,
      client: <HeadSection {...sharedProps} />,
    });

    expectNoHydrationErrors(result);
  });

  it("does not cause hydration errors for published guide in Spanish", () => {
    const guideKey = "positanoMainBeach" as const;
    const lang = "es" as const;
    const pageTitle = "Guía de la Playa Principal de Positano"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const description = "Guía completa de la Playa Principal de Positano"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const previewBannerLabel = "Vista previa"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const breadcrumb = {
      "@context": "https://schema.org" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org context URL, non-UI
      "@type": "BreadcrumbList" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
      itemListElement: [],
    };

    const sharedProps = {
      lang,
      guideKey,
      search: "", // Published guide, no search params
      pageTitle,
      description,
      previewBannerLabel,
      breadcrumb,
      howToJson: null,
      suppressTwitterCardResolve: true,
    };

    const result = renderWithHydration({
      server: <HeadSection {...sharedProps} />,
      client: <HeadSection {...sharedProps} />,
    });

    expectNoHydrationErrors(result);
  });
});
