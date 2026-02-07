import type { TFunction } from "i18next";

import { resolveGuideCardImage } from "@/lib/guides/guideCardImage";
import { getGuideManifestEntry } from "@/routes/guides/guide-manifest";

jest.mock("@/routes/guides/guide-manifest", () => ({
  getGuideManifestEntry: jest.fn(),
}));

const getGuideManifestEntryMock = getGuideManifestEntry as jest.MockedFunction<typeof getGuideManifestEntry>;

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
  });

  it("normalizes local hero image paths for card rendering", () => {
    getGuideManifestEntryMock.mockReturnValue({
      contentKey: "travelHelp",
      blocks: [{ type: "hero", options: { image: "img/cards/travel-help.jpg" } }],
    } as never);

    const result = resolveGuideCardImage("travelHelp", "en", createTranslator(), createTranslator());

    expect(result).toEqual({ src: "/img/cards/travel-help.jpg", alt: undefined });
  });

  it("uses section image when no hero image is declared", () => {
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

  it("falls back to generated EN content image when guides namespace omits sections", () => {
    getGuideManifestEntryMock.mockReturnValue({
      contentKey: "travelHelp",
      blocks: [],
    } as never);

    const result = resolveGuideCardImage("travelHelp", "en", createTranslator(), createTranslator());

    expect(result).toEqual({
      src: "/img/directions/positano-bus-stop.webp",
      alt: "Local bus stop area in Positano",
    });
  });
});
