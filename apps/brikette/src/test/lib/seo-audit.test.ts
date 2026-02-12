import fs from "fs/promises";

import { auditGuideSeo } from "@/lib/seo-audit";

jest.mock("fs/promises", () => ({
  __esModule: true,
  default: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock("@/routes/guides/guide-manifest", () => {
  const makeEntry = (key: string, primaryArea: "help" | "experience" = "help") => ({
    key,
    slug: key,
    contentKey: key,
    status: "draft",
    areas: [primaryArea],
    primaryArea,
    structuredData: ["Article"],
    relatedGuides: [],
    blocks: [],
    options: {},
    template: primaryArea === "help" ? "help" : undefined,
  });

  const known = new Set(["testGuide", "targetA", "targetB", "targetC", "targetD"]);

  return {
    __esModule: true,
    getGuideManifestEntry: (key: string) => (known.has(key) ? makeEntry(key) : undefined),
  };
});

const mockReadFile = fs.readFile as unknown as jest.MockedFunction<typeof fs.readFile>;

describe("seo-audit", () => {
  it("counts section images and extracts internal links from tips and q/a FAQs", async () => {
    const longIntro = Array.from({ length: 650 }, (_, i) => `word${i}`).join(" ");

    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        seo: { title: "Test title", description: "Test description" },
        intro: [longIntro],
        tips: ["See %LINK:targetA|Guide A% for more info."],
        sections: [
          {
            id: "s1",
            title: "Section 1",
            body: ["Body text with %LINK:targetB|Guide B%."],
            images: [
              { src: "/img/a.jpg", alt: "Alt A" },
              { src: "/img/b.jpg", alt: "Alt B" },
            ],
          },
        ],
        faqs: [{ q: "Question?", a: ["Answer with %LINK:targetC|Guide C%."] }],
      }),
    );

    const results = await auditGuideSeo("testGuide" as any, "en");

    expect(results.metrics.imageCount).toBe(2);
    expect(results.metrics.internalLinkCount).toBe(3);
    expect(results.metrics.invalidInternalLinkOccurrences).toBe(0);
  });
});

