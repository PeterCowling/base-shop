import "@testing-library/jest-dom";

import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

import type { GuideSeoTemplateContext } from "@/routes/guides/guide-seo/types";
import type { GalleryBlockOptions } from "@/routes/guides/blocks/types";
import { BlockAccumulator } from "@/routes/guides/blocks/handlers/BlockAccumulator";
import { applyGalleryBlock } from "@/routes/guides/blocks/handlers/galleryBlock";
import type { GuideManifestEntry } from "@/routes/guides/guide-manifest";

// Mock design system Dialog primitives
jest.mock("@acme/design-system/primitives", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-root">{children}</div>,
  DialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="dialog-trigger">{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-title">{children}</div>,
}));

// Mock CfResponsiveImage
jest.mock("@acme/ui/atoms/CfResponsiveImage", () => ({
  CfResponsiveImage: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="cf-image" {...props} />
  ),
}));

// Mock buildCfImageUrl
jest.mock("@acme/ui/lib/buildCfImageUrl", () => ({
  __esModule: true,
  default: (src: string) => src,
}));

// Mock ImageGallery for non-zoomable tests
jest.mock("@/components/guides/ImageGallery", () => ({
  __esModule: true,
  default: ({ items }: { items: Array<{ src: string; alt: string }> }) => (
    <div data-testid="image-gallery">
      {items.map((item, i) => (
        <img key={i} src={item.src} alt={item.alt} data-testid="gallery-image" />
      ))}
    </div>
  ),
}));

const makeContext = (overrides: Partial<GuideSeoTemplateContext> = {}): GuideSeoTemplateContext => ({
  lang: "en",
  guideKey: "testGuide",
  metaKey: "testGuide",
  hasLocalizedContent: true,
  translator: ((key: string) => key) as GuideSeoTemplateContext["translator"],
  translateGuides: ((key: string) => key) as GuideSeoTemplateContext["translateGuides"],
  translateGuidesEn: ((key: string) => key) as GuideSeoTemplateContext["translateGuidesEn"],
  sections: [],
  intro: [],
  faqs: [],
  toc: [],
  ogImage: { url: "/test-og.jpg", width: 1200, height: 630 },
  article: { title: "Test Guide", description: "Test description" },
  canonicalUrl: "/test",
  ...overrides,
});

const makeManifestEntry = (): GuideManifestEntry => ({
  key: "testGuide",
  slug: "test-guide",
  section: "experiences",
  blocks: [],
  relatedGuides: [],
});

describe("Gallery block zoomable option", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("schema validation", () => {
    it("accepts zoomable: true option", () => {
      const options: GalleryBlockOptions = {
        items: [{ image: "/test.jpg", alt: "Test" }],
        zoomable: true,
      };

      // If zoomable is not in the schema, TypeScript will error here
      expect(options.zoomable).toBe(true);
    });

    it("accepts zoomable: false option", () => {
      const options: GalleryBlockOptions = {
        items: [{ image: "/test.jpg", alt: "Test" }],
        zoomable: false,
      };

      expect(options.zoomable).toBe(false);
    });

    it("defaults to non-zoomable when option is omitted", () => {
      const options: GalleryBlockOptions = {
        items: [{ image: "/test.jpg", alt: "Test" }],
      };

      expect(options.zoomable).toBeUndefined();
    });
  });

  describe("rendering behavior", () => {
    it("renders standard ImageGallery when zoomable is false", () => {
      const acc = new BlockAccumulator(makeManifestEntry());
      const options: GalleryBlockOptions = {
        items: [
          { image: "/test1.jpg", alt: "Test 1" },
          { image: "/test2.jpg", alt: "Test 2" },
        ],
        zoomable: false,
      };

      applyGalleryBlock(acc, options);
      const template = acc.buildTemplate();
      const context = makeContext();

      // Render the slot
      const { container } = render(<>{template.articleExtras?.(context)}</>);

      expect(screen.getByTestId("image-gallery")).toBeInTheDocument();
      expect(screen.queryByTestId("dialog-root")).not.toBeInTheDocument();
    });

    it("renders standard ImageGallery when zoomable option is omitted", () => {
      const acc = new BlockAccumulator(makeManifestEntry());
      const options: GalleryBlockOptions = {
        items: [{ image: "/test.jpg", alt: "Test" }],
      };

      applyGalleryBlock(acc, options);
      const template = acc.buildTemplate();
      const context = makeContext();

      render(<>{template.articleExtras?.(context)}</>);

      expect(screen.getByTestId("image-gallery")).toBeInTheDocument();
      expect(screen.queryByTestId("dialog-root")).not.toBeInTheDocument();
    });

    it("renders zoomable gallery with Dialog when zoomable is true", () => {
      const acc = new BlockAccumulator(makeManifestEntry());
      const options: GalleryBlockOptions = {
        items: [
          { image: "/test1.jpg", alt: "Test Image 1" },
          { image: "/test2.jpg", alt: "Test Image 2" },
        ],
        zoomable: true,
      };

      applyGalleryBlock(acc, options);
      const template = acc.buildTemplate();
      const context = makeContext();

      render(<>{template.articleExtras?.(context)}</>);

      // Should render Dialog components for each image
      expect(screen.getAllByTestId("dialog-root")).toHaveLength(2);
      expect(screen.getAllByTestId("dialog-trigger")).toHaveLength(2);
    });

    it("includes zoom icon indicator on zoomable images", () => {
      const acc = new BlockAccumulator(makeManifestEntry());
      const options: GalleryBlockOptions = {
        items: [{ image: "/test.jpg", alt: "Test" }],
        zoomable: true,
      };

      applyGalleryBlock(acc, options);
      const template = acc.buildTemplate();
      const context = makeContext();

      const { container } = render(<>{template.articleExtras?.(context)}</>);

      // Should have a zoom indicator (ZoomIn icon or similar visual cue)
      const zoomIndicator = container.querySelector('[aria-hidden="true"]');
      expect(zoomIndicator).toBeInTheDocument();
    });

    it("displays image caption in zoomable gallery", () => {
      const acc = new BlockAccumulator(makeManifestEntry());
      const options: GalleryBlockOptions = {
        items: [{ image: "/test.jpg", alt: "Test", caption: "A beautiful view" }],
        zoomable: true,
      };

      applyGalleryBlock(acc, options);
      const template = acc.buildTemplate();
      const context = makeContext();

      render(<>{template.articleExtras?.(context)}</>);

      expect(screen.getByText("A beautiful view")).toBeInTheDocument();
    });

    it("uses alt text as Dialog title when caption is not provided", () => {
      const acc = new BlockAccumulator(makeManifestEntry());
      const options: GalleryBlockOptions = {
        items: [{ image: "/test.jpg", alt: "Mountain Sunrise" }],
        zoomable: true,
      };

      applyGalleryBlock(acc, options);
      const template = acc.buildTemplate();
      const context = makeContext();

      render(<>{template.articleExtras?.(context)}</>);

      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Mountain Sunrise");
    });

    it("renders heading when headingKey is provided", () => {
      const translateGuides = (key: string) => {
        if (key === "gallery.title") return "Photo Gallery";
        return key;
      };

      const acc = new BlockAccumulator(makeManifestEntry());
      const options: GalleryBlockOptions = {
        items: [{ image: "/test.jpg", alt: "Test" }],
        headingKey: "gallery.title",
        zoomable: true,
      };

      applyGalleryBlock(acc, options);
      const template = acc.buildTemplate();
      const context = makeContext({
        translateGuides: translateGuides as GuideSeoTemplateContext["translateGuides"],
      });

      render(<>{template.articleExtras?.(context)}</>);

      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Photo Gallery");
    });
  });

  describe("accessibility", () => {
    it("zoomable gallery images are keyboard accessible", () => {
      const acc = new BlockAccumulator(makeManifestEntry());
      const options: GalleryBlockOptions = {
        items: [{ image: "/test.jpg", alt: "Test" }],
        zoomable: true,
      };

      applyGalleryBlock(acc, options);
      const template = acc.buildTemplate();
      const context = makeContext();

      render(<>{template.articleExtras?.(context)}</>);

      // The trigger should be a button (keyboard accessible)
      const trigger = screen.getByTestId("dialog-trigger");
      const button = trigger.querySelector("button");
      expect(button).toBeInTheDocument();
    });
  });
});
