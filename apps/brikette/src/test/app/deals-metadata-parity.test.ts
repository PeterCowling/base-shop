import type { Metadata } from "next";

const getTranslationsMock = jest.fn<Promise<(key: string, options?: Record<string, unknown>) => string>, unknown[]>(async () => {
  return (key: string, options?: Record<string, unknown>) => {
    if (key === "meta.title") {
      const pct = typeof options?.percent === "string" ? options.percent : "15%";
      return `Save ${pct} on stays Sept 20 - Oct 31`;
    }
    if (key === "meta.description") {
      const pct = typeof options?.percent === "string" ? options.percent : "15%";
      return `Limited-time offer: save ${pct} on direct bookings for stays from Sept 20 to Oct 31.`;
    }
    if (typeof options?.defaultValue === "string") return options.defaultValue;
    return key;
  };
});

jest.mock("@/app/_lib/i18n-server", () => ({
  toAppLanguage: (lang: string) => (lang === "en" ? "en" : "en"),
  getTranslations: (...args: unknown[]) =>
    getTranslationsMock(...(args as [string, readonly string[]])),
}));

describe("deals metadata parity contract", () => {
  beforeEach(() => {
    getTranslationsMock.mockClear();
    jest.useFakeTimers().setSystemTime(new Date("2026-02-10T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not advertise a stale active discount in metadata when all deals are expired", async () => {
    const { generateMetadata } = await import("@/app/[lang]/deals/page");
    const metadata = (await generateMetadata({
      params: Promise.resolve({ lang: "en" }),
    })) as Metadata;

    const title =
      typeof metadata.title === "string"
        ? metadata.title
        : typeof metadata.title === "object" && metadata.title && "absolute" in metadata.title
          ? String(metadata.title.absolute ?? "")
          : "";

    expect(title).not.toMatch(/save\s*15%/i);
  });
});
