/* eslint-disable no-console -- investigation test uses console.log for findings */
/**
 * TASK-07 Investigation: Test whether i18n content timing can cause HowTo script
 * divergence between SSR and client, creating structural hydration errors.
 */

import React from "react";

import HeadSection from "@/routes/guides/guide-seo/components/HeadSection";
import { renderWithHydration } from "@/test/helpers/hydrationTestUtils";

describe("HowTo script structural divergence (TASK-07 investigation)", () => {
  it("INVESTIGATE: simulates HowTo script appearing on client but not SSR (sections empty → populated)", () => {
    const guideKey = "pathOfTheGods" as const;
    const lang = "en" as const;
    const pageTitle = "Path of the Gods Hike Guide"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const description = "Complete hiking guide for Path of the Gods"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const breadcrumb = {
      "@context": "https://schema.org" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org context URL, non-UI
      "@type": "BreadcrumbList" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
      itemListElement: [],
    };

    // SSR: sections not yet loaded, howToJson is null
    const serverProps = {
      lang,
      guideKey,
      search: "",
      pageTitle,
      description,
      breadcrumb,
      howToJson: null, // No HowTo script on SSR
      suppressTwitterCardResolve: true,
    };

    // Client: sections loaded, howToJson is populated
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

    const clientProps = {
      ...serverProps,
      howToJson: mockHowToJson, // HowTo script appears on client
    };

    const result = renderWithHydration({
      server: <HeadSection {...serverProps} />,
      client: <HeadSection {...clientProps} />,
    });

    // Investigation findings:
    // - If hydrationErrors.length > 0, this indicates structural divergence
    // - The script element appears on client but not SSR (null → <script>)
    // - This would be a hydration mismatch that needs fixing

    // Log findings for investigation
    console.log("[TASK-07 Investigation] HowTo script divergence test results:", {
      hydrationErrorCount: result.hydrationErrors.length,
      hasHydrationErrors: result.hydrationErrors.length > 0,
      errorMessages: result.hydrationErrors.map((e) => e.message),
    });

    // For investigation purposes, we're NOT asserting zero errors here
    // Instead, we want to see if errors occur
    // If errors occur, this confirms the issue and we'll need to fix it

    // Document the finding:
    if (result.hydrationErrors.length > 0) {
      console.warn(
        "[TASK-07 Finding] HowTo script structural divergence DETECTED. " +
          "When sections are empty on SSR (howToJson=null) but populated on client (howToJson!=null), " +
          "a hydration error occurs because HeadSection conditionally renders the <script> tag.",
      );
    } else {
      console.log(
        "[TASK-07 Finding] No hydration errors detected for HowTo script divergence. " +
          "The suppressHydrationWarning on the script tag may be masking the issue, or the " +
          "null → script transition is handled gracefully by React 19.",
      );
    }

    // This test is investigative - we're documenting the behavior, not enforcing it
    expect(result.hydrationErrors.length).toBeGreaterThanOrEqual(0);
  });

  it("INVESTIGATE: simulates consistent HowTo script (present on both SSR and client)", () => {
    const guideKey = "pathOfTheGods" as const;
    const lang = "en" as const;
    const pageTitle = "Path of the Gods Hike Guide"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const description = "Complete hiking guide for Path of the Gods"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
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

    const sharedProps = {
      lang,
      guideKey,
      search: "",
      pageTitle,
      description,
      breadcrumb,
      howToJson: mockHowToJson, // Script present on both SSR and client
      suppressTwitterCardResolve: true,
    };

    const result = renderWithHydration({
      server: <HeadSection {...sharedProps} />,
      client: <HeadSection {...sharedProps} />,
    });

    console.log("[TASK-07 Investigation] Consistent HowTo script test results:", {
      hydrationErrorCount: result.hydrationErrors.length,
      hasHydrationErrors: result.hydrationErrors.length > 0,
    });

    // When HowTo script is consistent (present on both SSR and client),
    // there should be no structural divergence
    expect(result.hydrationErrors.length).toBe(0);
  });

  it("INVESTIGATE: simulates consistent HowTo script (absent on both SSR and client)", () => {
    const guideKey = "pathOfTheGods" as const;
    const lang = "en" as const;
    const pageTitle = "Path of the Gods Hike Guide"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const description = "Complete hiking guide for Path of the Gods"; // i18n-exempt -- TEST-000 [ttl=2026-12-31] Test fixture data, non-UI
    const breadcrumb = {
      "@context": "https://schema.org" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org context URL, non-UI
      "@type": "BreadcrumbList" as const, // i18n-exempt -- TEST-000 [ttl=2026-12-31] Schema.org type, non-UI
      itemListElement: [],
    };

    const sharedProps = {
      lang,
      guideKey,
      search: "",
      pageTitle,
      description,
      breadcrumb,
      howToJson: null, // No script on SSR or client
      suppressTwitterCardResolve: true,
    };

    const result = renderWithHydration({
      server: <HeadSection {...sharedProps} />,
      client: <HeadSection {...sharedProps} />,
    });

    console.log("[TASK-07 Investigation] No HowTo script test results:", {
      hydrationErrorCount: result.hydrationErrors.length,
      hasHydrationErrors: result.hydrationErrors.length > 0,
    });

    // When HowTo script is consistently absent, there should be no divergence
    expect(result.hydrationErrors.length).toBe(0);
  });
});
