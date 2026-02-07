import type { TFunction } from "i18next";

import { getGuideCardImageFallback } from "@/data/guideCardImageFallbacks";
import { resolveGuideCardImage } from "@/lib/guides/guideCardImage";
import { getGuideManifestEntry } from "@/routes/guides/guide-manifest";

jest.mock("@/routes/guides/guide-manifest", () => ({
  getGuideManifestEntry: jest.fn(),
}));
jest.mock("@/data/guideCardImageFallbacks", () => {
  const actual = jest.requireActual("@/data/guideCardImageFallbacks");
  return {
    ...actual,
    getGuideCardImageFallback: jest.fn(actual.getGuideCardImageFallback),
  };
});

const getGuideManifestEntryMock = getGuideManifestEntry as jest.MockedFunction<typeof getGuideManifestEntry>;
const getGuideCardImageFallbackMock =
  getGuideCardImageFallback as jest.MockedFunction<typeof getGuideCardImageFallback>;

function createTranslator(sectionSrc?: string): TFunction<"guides"> {
  return ((key: string) => {
    if (key === "content.travelHelp.sections" && sectionSrc) {
      return [{ images: [{ src: sectionSrc, alt: "Section image alt" }] }];
    }
    return "";
  }) as unknown as TFunction<"guides">;
}

describe("resolveGuideCardImage", () => {
  beforeEach(() => {
    getGuideManifestEntryMock.mockReset();
    getGuideCardImageFallbackMock.mockReset();
    getGuideCardImageFallbackMock.mockImplementation((contentKey: string) =>
      jest.requireActual("@/data/guideCardImageFallbacks").getGuideCardImageFallback(contentKey),
    );
  });

  it("normalizes local hero image paths for card rendering", () => {
    getGuideManifestEntryMock.mockReturnValue({
      contentKey: "travelHelp",
      blocks: [{ type: "hero", options: { image: "img/cards/travel-help.jpg" } }],
    } as never);

    const result = resolveGuideCardImage("travelHelp", "en", createTranslator(), createTranslator());

    expect(result).toEqual({ src: "/img/cards/travel-help.jpg", alt: undefined });
  });

  it("prefers generated fallback image when available and no hero image is declared", () => {
    getGuideManifestEntryMock.mockReturnValue({
      contentKey: "travelHelp",
      blocks: [],
    } as never);

    const result = resolveGuideCardImage(
      "travelHelp",
      "en",
      createTranslator("img/cards/from-section.jpg"),
      createTranslator("img/cards/from-section.jpg"),
    );

    expect(result).toEqual({
      src: "/img/directions/positano-bus-stop.webp",
      alt: "Local bus stop area in Positano",
    });
  });

  it("uses section image when no hero image or generated fallback is available", () => {
    getGuideManifestEntryMock.mockReturnValue({
      contentKey: "travelHelp",
      blocks: [],
    } as never);
    getGuideCardImageFallbackMock.mockReturnValueOnce(null);

    const result = resolveGuideCardImage(
      "travelHelp",
      "en",
      createTranslator("img/cards/from-section.jpg"),
      createTranslator("img/cards/from-section.jpg"),
    );

    expect(result).toEqual({ src: "/img/cards/from-section.jpg", alt: "Section image alt" });
  });

  it("keeps absolute image URLs unchanged", () => {
    getGuideManifestEntryMock.mockReturnValue({
      contentKey: "travelHelp",
      blocks: [{ type: "hero", options: { image: "https://example.com/hero.jpg" } }],
    } as never);

    const result = resolveGuideCardImage("travelHelp", "en", createTranslator(), createTranslator());

    expect(result).toEqual({ src: "https://example.com/hero.jpg", alt: undefined });
  });
});
