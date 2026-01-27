/**
 * Tests for TASK-04: Add explicit transport drop-in block for Chiesa Nuova
 *
 * Verifies that the transportDropIn block renders the Chiesa Nuova component.
 */

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { GuideSeoTemplateContext } from "@/routes/guides/guide-seo/types";
import { applyTransportDropInBlock } from "@/routes/guides/blocks/handlers/transportDropInBlock";
import { BlockAccumulator } from "@/routes/guides/blocks/handlers/BlockAccumulator";
import type { GuideManifestEntry } from "@/routes/guides/guide-manifest";
import type { TransportDropInBlockOptions } from "@/routes/guides/blocks/types";

// Mock the Chiesa Nuova component
jest.mock("@/routes/how-to-get-here/chiesaNuovaArrivals/DropIn", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => (
    <div data-testid="chiesa-nuova-dropin" data-lang={lang}>
      Chiesa Nuova Arrivals Drop-in for {lang}
    </div>
  ),
}));

describe("transportDropIn block handler (TASK-04)", () => {
  let mockContext: GuideSeoTemplateContext;
  let mockManifest: GuideManifestEntry;

  beforeEach(() => {
    jest.clearAllMocks();

    mockManifest = {
      guideKey: "testGuide",
      areas: ["experiences"],
      blocks: [],
      relatedGuides: [],
      contentKey: "testGuide",
    } as GuideManifestEntry;

    mockContext = {
      guideKey: "testGuide",
      lang: "en",
    } as GuideSeoTemplateContext;
  });

  it("renders Chiesa Nuova arrivals drop-in", () => {
    const options: TransportDropInBlockOptions = {
      component: "chiesaNuovaArrivals",
    };

    const acc = new BlockAccumulator(mockManifest);
    applyTransportDropInBlock(acc, options);
    const template = acc.buildTemplate();

    expect(template.afterArticle).toBeDefined();
    const afterArticle = template.afterArticle as (ctx: GuideSeoTemplateContext) => ReactNode;
    const result = afterArticle(mockContext);

    const { container } = render(<div>{result}</div>);

    expect(container).toBeInTheDocument();
    const dropIn = screen.getByTestId("chiesa-nuova-dropin");
    expect(dropIn).toBeInTheDocument();
    expect(dropIn).toHaveAttribute("data-lang", "en");
  });

  it("renders drop-in with correct language context", () => {
    const options: TransportDropInBlockOptions = {
      component: "chiesaNuovaArrivals",
    };

    const italianContext = {
      ...mockContext,
      lang: "it",
    } as GuideSeoTemplateContext;

    const acc = new BlockAccumulator(mockManifest);
    applyTransportDropInBlock(acc, options);
    const template = acc.buildTemplate();

    const afterArticle = template.afterArticle as (ctx: GuideSeoTemplateContext) => ReactNode;
    const result = afterArticle(italianContext);

    const { container } = render(<div>{result}</div>);

    const dropIn = screen.getByTestId("chiesa-nuova-dropin");
    expect(dropIn).toHaveAttribute("data-lang", "it");
  });

  it("renders in afterArticle slot (before footer widgets)", () => {
    const options: TransportDropInBlockOptions = {
      component: "chiesaNuovaArrivals",
    };

    const acc = new BlockAccumulator(mockManifest);
    applyTransportDropInBlock(acc, options);
    const template = acc.buildTemplate();

    // Should be in afterArticle slot, not articleExtras
    expect(template.afterArticle).toBeDefined();
    expect(template.articleExtras).toBeUndefined();
  });

  it("returns null for unsupported component", () => {
    const options = {
      component: "unsupportedComponent",
    } as TransportDropInBlockOptions;

    const acc = new BlockAccumulator(mockManifest);
    applyTransportDropInBlock(acc, options);
    const template = acc.buildTemplate();

    const afterArticle = template.afterArticle as (ctx: GuideSeoTemplateContext) => ReactNode;
    const result = afterArticle(mockContext);

    expect(result).toBeNull();
  });
});
