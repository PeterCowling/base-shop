import type { Metadata } from "next";

describe("how-to-get-here metadata", () => {
  it("uses search-intent English copy instead of the legacy placeholder title", async () => {
    const { generateMetadata } = await import("@/app/[lang]/how-to-get-here/page");
    const metadata = (await generateMetadata({
      params: Promise.resolve({ lang: "en" }),
    })) as Metadata;

    const title =
      typeof metadata.title === "string"
        ? metadata.title
        : typeof metadata.title === "object" && metadata.title && "absolute" in metadata.title
          ? String(metadata.title.absolute ?? "")
          : "";

    expect(title).toBe("How to Get to Hostel Brikette in Positano | Arrival Guide");
    expect(title).not.toMatch(/list of travel directions/i);
    expect(metadata.description).toBe(
      "Plan your arrival to Hostel Brikette from Naples, Salerno, Sorrento, Amalfi, Capri, Ravello, and Rome with transport pros, cons, and step-by-step guidance.",
    );
  });
});
