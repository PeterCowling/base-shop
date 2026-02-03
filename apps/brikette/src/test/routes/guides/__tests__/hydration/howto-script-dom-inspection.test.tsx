/**
 * TASK-07 Investigation: Inspect actual DOM structure to understand HowTo script
 * rendering and confirm whether suppressHydrationWarning masks structural divergence.
 */

import React from "react";

import HeadSection from "@/routes/guides/guide-seo/components/HeadSection";
import { renderWithHydration } from "@/test/helpers/hydrationTestUtils";

describe("HowTo script DOM structure inspection (TASK-07)", () => {
  it("inspects DOM structure when HowTo script diverges (null → script)", () => {
    const guideKey = "pathOfTheGods" as const;
    const lang = "en" as const;
    const pageTitle = "Path of the Gods Hike Guide"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const description = "Complete hiking guide for Path of the Gods"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const previewBannerLabel = "Preview"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const breadcrumb = {
      "@context": "https://schema.org" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org context URL, non-UI
      "@type": "BreadcrumbList" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
      itemListElement: [],
    };

    const mockHowToJson = JSON.stringify({
      "@context": "https://schema.org", // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org context, non-UI
      "@type": "HowTo", // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
      name: pageTitle, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
      step: [
        {
          "@type": "HowToStep", // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
          name: "Start the hike", // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
          text: "Begin at the trailhead", // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
        },
      ],
    });

    const serverProps = {
      lang,
      guideKey,
      search: "",
      pageTitle,
      description,
      previewBannerLabel,
      breadcrumb,
      howToJson: null,
      howToJsonType: "application/ld+json" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] MIME type, non-UI
      suppressTwitterCardResolve: true,
    };

    const clientProps = {
      ...serverProps,
      howToJson: mockHowToJson,
    };

    const result = renderWithHydration({
      server: <HeadSection {...serverProps} />,
      client: <HeadSection {...clientProps} />,
    });

    // Inspect SSR HTML for script elements
    const serverScripts = result.serverHTML.match(/<script[^>]*>/g) || [];
    // Look specifically for HowTo structured data (not Article or Breadcrumb)
    const serverHasHowToScript = result.serverHTML.includes('"@type":"HowTo"') || result.serverHTML.includes('"@type": "HowTo"');

    // Inspect client DOM for script elements
    const clientScripts = result.container.querySelectorAll('script[type="application/ld+json"]');
    const clientHowToScripts = Array.from(clientScripts).filter((script) =>
      script.innerHTML.includes('"@type":"HowTo"') || script.innerHTML.includes('"@type": "HowTo"')
    );

    console.log("[TASK-07 DOM Inspection] Script presence analysis:", {
      serverScripts: {
        totalCount: serverScripts.length,
        hasHowToScript: serverHasHowToScript,
        scriptTags: serverScripts,
      },
      clientScripts: {
        totalCount: clientScripts.length,
        howToScriptCount: clientHowToScripts.length,
        hasHowToScript: clientHowToScripts.length > 0,
      },
      structuralDivergence: {
        serverHasHowToScript: serverHasHowToScript,
        clientHasHowToScript: clientHowToScripts.length > 0,
        isDivergent: serverHasHowToScript !== (clientHowToScripts.length > 0),
        divergenceType: serverHasHowToScript ? "none" : (clientHowToScripts.length > 0 ? "script-added-on-client" : "none"),
      },
      hydrationErrors: result.hydrationErrors.length,
    });

    // Analysis: Even if structural divergence exists (script present on client but not SSR),
    // React 19 may not flag it as a hydration error if:
    // 1. suppressHydrationWarning is working on the parent
    // 2. React considers null → element transitions acceptable
    // 3. The divergence happens inside a client-rendered boundary

    expect(result.hydrationErrors.length).toBe(0);
  });

  it("inspects element order and structure in HeadSection", () => {
    const guideKey = "pathOfTheGods" as const;
    const lang = "en" as const;
    const pageTitle = "Path of the Gods Hike Guide"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const description = "Complete hiking guide for Path of the Gods"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const previewBannerLabel = "Preview"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const breadcrumb = {
      "@context": "https://schema.org" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org context URL, non-UI
      "@type": "BreadcrumbList" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
      itemListElement: [],
    };

    const mockHowToJson = JSON.stringify({
      "@context": "https://schema.org", // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org context, non-UI
      "@type": "HowTo", // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
      name: pageTitle, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    });

    const serverProps = {
      lang,
      guideKey,
      search: "",
      pageTitle,
      description,
      previewBannerLabel,
      breadcrumb,
      howToJson: null,
      howToJsonType: "application/ld+json" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] MIME type, non-UI
      suppressTwitterCardResolve: true,
    };

    const clientProps = {
      ...serverProps,
      howToJson: mockHowToJson,
    };

    const result = renderWithHydration({
      server: <HeadSection {...serverProps} />,
      client: <HeadSection {...clientProps} />,
    });

    // Count child elements
    const serverChildren = result.serverHTML.match(/<[^>]+>/g) || [];
    const clientChildCount = result.container.children.length;

    // HeadSection structure (from HeadSection.tsx):
    // 1. PreviewBanner (div or hidden div)
    // 2. ArticleStructuredData (script)
    // 3. BreadcrumbStructuredData (script)
    // 4. HowTo script (conditional - only if howToJson)
    // 5. additionalScripts (conditional)

    console.log("[TASK-07 Structure Analysis] Element count:", {
      serverChildCount: serverChildren.length,
      clientChildCount,
      expectedDifferenceIfDivergent: "Client should have +1 script if HowTo appears",
    });

    expect(result.hydrationErrors.length).toBe(0);
  });
});
