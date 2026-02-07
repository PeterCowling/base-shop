import React from "react";

import FaqStructuredDataBlock from "@/routes/guides/guide-seo/components/FaqStructuredDataBlock";
import { expectNoHydrationErrors, renderWithHydration } from "@/test/helpers/hydrationTestUtils";

jest.mock("@/components/seo/GuideFaqJsonLd", () => {
  return {
    __esModule: true,
    default: ({ guideKey }: { guideKey: string }) => (
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `{"@context":"https://schema.org","@type":"FAQPage","name":"${guideKey}"}`,
        }}
      />
    ),
  };
});

describe("FaqStructuredDataBlock hydration", () => {
  const tGuides = (key: string) => key;

  it("does not cause hydration errors when FAQ eligibility flips (SSR: script, client: placeholder)", () => {
    const result = renderWithHydration({
      server: (
        <FaqStructuredDataBlock
          guideKey={"positanoMainBeach" as const}
          hasLocalizedContent
          suppressUnlocalizedFallback
          tGuides={tGuides}
        />
      ),
      client: (
        <FaqStructuredDataBlock
          guideKey={"positanoMainBeach" as const}
          hasLocalizedContent={false}
          suppressUnlocalizedFallback
          tGuides={tGuides}
        />
      ),
    });

    expectNoHydrationErrors(result);
    expect(result.container.querySelector('script[type="application/ld+json"]')).toBeTruthy();
  });

  it("does not cause hydration errors when FAQ eligibility flips (SSR: placeholder, client: script)", () => {
    const result = renderWithHydration({
      server: (
        <FaqStructuredDataBlock
          guideKey={"positanoMainBeach" as const}
          hasLocalizedContent={false}
          suppressUnlocalizedFallback
          tGuides={tGuides}
        />
      ),
      client: (
        <FaqStructuredDataBlock
          guideKey={"positanoMainBeach" as const}
          hasLocalizedContent
          suppressUnlocalizedFallback
          tGuides={tGuides}
        />
      ),
    });

    expectNoHydrationErrors(result);
    expect(result.container.querySelector('script[type="application/ld+json"]')).toBeTruthy();
  });
});

