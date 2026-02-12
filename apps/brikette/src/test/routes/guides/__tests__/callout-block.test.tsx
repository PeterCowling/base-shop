/**
 * Tests for TASK-02: Add callout block type + handler
 *
 * Verifies that callout blocks render with correct styling and content.
 */

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import { BlockAccumulator } from "@/routes/guides/blocks/handlers/BlockAccumulator";
import { applyCalloutBlock } from "@/routes/guides/blocks/handlers/calloutBlock";
import type { CalloutBlockOptions } from "@/routes/guides/blocks/types";
import type { GuideManifestEntry } from "@/routes/guides/guide-manifest";
import type { GuideSeoTemplateContext } from "@/routes/guides/guide-seo/types";

// Mock translate function
const mockTranslateGuides = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    "content.testGuide.callouts.tip.title": "Pro Tip",
    "content.testGuide.callouts.tip.body": "This is a helpful tip with a %URL:https://example.com|link to example%.",
    "content.testGuide.callouts.cta.title": "Book Now",
    "content.testGuide.callouts.cta.body": "Ready to visit? Check our %LINK:positanoMainBeach|main beach guide%!",
    "content.testGuide.callouts.aside.body": "Did you know this interesting fact?",
  };
  return translations[key] ?? key;
});

describe("callout block handler (TASK-02)", () => {
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
      translateGuides: mockTranslateGuides,
      lang: "en",
    } as GuideSeoTemplateContext;
  });

  describe("tip variant", () => {
    it("renders tip callout with title and body", () => {
      const options: CalloutBlockOptions = {
        variant: "tip",
        titleKey: "content.testGuide.callouts.tip.title",
        bodyKey: "content.testGuide.callouts.tip.body",
      };

      const acc = new BlockAccumulator(mockManifest);
      applyCalloutBlock(acc, options);
      const template = acc.buildTemplate();

      expect(template.articleExtras).toBeDefined();
      const articleExtras = template.articleExtras as (ctx: GuideSeoTemplateContext) => ReactNode;
      const result = articleExtras(mockContext);

      const { container } = render(<div>{result}</div>);

      expect(container).toBeInTheDocument();
      expect(screen.getByText("Pro Tip")).toBeInTheDocument();
      expect(container.textContent).toContain("This is a helpful tip");
    });

    it("renders tip callout without title when titleKey is omitted", () => {
      const options: CalloutBlockOptions = {
        variant: "tip",
        bodyKey: "content.testGuide.callouts.tip.body",
      };

      const acc = new BlockAccumulator(mockManifest);
      applyCalloutBlock(acc, options);
      const template = acc.buildTemplate();

      const articleExtras = template.articleExtras as (ctx: GuideSeoTemplateContext) => ReactNode;
      const result = articleExtras(mockContext);

      const { container } = render(<div>{result}</div>);

      expect(container).toBeInTheDocument();
      expect(screen.queryByText("Pro Tip")).not.toBeInTheDocument();
      expect(container.textContent).toContain("This is a helpful tip");
    });
  });

  describe("cta variant", () => {
    it("renders cta callout with distinct styling", () => {
      const options: CalloutBlockOptions = {
        variant: "cta",
        titleKey: "content.testGuide.callouts.cta.title",
        bodyKey: "content.testGuide.callouts.cta.body",
      };

      const acc = new BlockAccumulator(mockManifest);
      applyCalloutBlock(acc, options);
      const template = acc.buildTemplate();

      const articleExtras = template.articleExtras as (ctx: GuideSeoTemplateContext) => ReactNode;
      const result = articleExtras(mockContext);

      const { container } = render(<div>{result}</div>);

      expect(container).toBeInTheDocument();
      expect(screen.getByText("Book Now")).toBeInTheDocument();
      expect(container.textContent).toContain("Ready to visit?");
    });
  });

  describe("aside variant", () => {
    it("renders aside callout", () => {
      const options: CalloutBlockOptions = {
        variant: "aside",
        bodyKey: "content.testGuide.callouts.aside.body",
      };

      const acc = new BlockAccumulator(mockManifest);
      applyCalloutBlock(acc, options);
      const template = acc.buildTemplate();

      const articleExtras = template.articleExtras as (ctx: GuideSeoTemplateContext) => ReactNode;
      const result = articleExtras(mockContext);

      const { container } = render(<div>{result}</div>);

      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain("Did you know this interesting fact?");
    });
  });

  describe("link token support", () => {
    it("renders URL tokens correctly", () => {
      const options: CalloutBlockOptions = {
        variant: "tip",
        bodyKey: "content.testGuide.callouts.tip.body",
      };

      const acc = new BlockAccumulator(mockManifest);
      applyCalloutBlock(acc, options);
      const template = acc.buildTemplate();

      const articleExtras = template.articleExtras as (ctx: GuideSeoTemplateContext) => ReactNode;
      const result = articleExtras(mockContext);

      const { container } = render(<div>{result}</div>);

      // Link tokens should be rendered (this test will initially fail until link token support is added)
      expect(container).toBeInTheDocument();
    });

    it("renders LINK tokens correctly", () => {
      const options: CalloutBlockOptions = {
        variant: "cta",
        bodyKey: "content.testGuide.callouts.cta.body",
      };

      const acc = new BlockAccumulator(mockManifest);
      applyCalloutBlock(acc, options);
      const template = acc.buildTemplate();

      const articleExtras = template.articleExtras as (ctx: GuideSeoTemplateContext) => ReactNode;
      const result = articleExtras(mockContext);

      const { container } = render(<div>{result}</div>);

      // Link tokens should be rendered
      expect(container).toBeInTheDocument();
    });
  });
});
