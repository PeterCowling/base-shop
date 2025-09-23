import { render, screen } from "@testing-library/react";
import {
  LOCALES,
  fillLocales,
  TranslationsProvider,
  useTranslations,
  parseMultilingualInput,
  resolveLocale,
} from "@acme/i18n";

describe("fillLocales", () => {
  it("fills missing locales and keeps provided", () => {
    const result = fillLocales({ en: "Hello" }, "Hi");

    expect(result.en).toBe("Hello");
    for (const loc of LOCALES) {
      if (loc === "en") continue;
      expect(result[loc as keyof typeof result]).toBe("Hi");
    }
  });

  it("preserves nested values without cloning", () => {
    // Use a locale that exists in LOCALES to verify reference preservation
    const target = LOCALES.includes("en" as any) ? "en" : LOCALES[0];
    const nested = { msg: "Hallo" } as any;
    const initial: any = { [target]: nested };
    const result = fillLocales(initial, "Hi" as any);

    expect(result[target as keyof typeof result]).toBe(nested);
  });
});

describe("Translations component", () => {
  function Show({ k }: { k: string }) {
    const t = useTranslations();
    return <span>{t(k)}</span>;
  }

  it("renders provided translation", async () => {
    render(
      <TranslationsProvider messages={{ greet: "Hello" }}>
        <Show k="greet" />
      </TranslationsProvider>
    );

    expect(await screen.findByText("Hello")).toBeInTheDocument();
  });

  it("falls back to key when missing", async () => {
    render(
      <TranslationsProvider messages={{}}>
        <Show k="missing" />
      </TranslationsProvider>
    );

    expect(await screen.findByText("missing")).toBeInTheDocument();
  });
});

describe("parseMultilingualInput", () => {
  it("parses valid field name", () => {
    expect(parseMultilingualInput("title_en", LOCALES)).toEqual({
      field: "title",
      locale: "en",
    });
  });

  it("returns null for unsupported locale", () => {
    expect(parseMultilingualInput("title_fr", LOCALES)).toBeNull();
  });
});

describe("locales", () => {
  it("includes 'en' and is non-empty", () => {
    expect(Array.isArray(LOCALES)).toBe(true);
    expect(LOCALES.length).toBeGreaterThan(0);
    expect(LOCALES).toContain("en");
  });

  it("falls back to 'en' for unknown locale", () => {
    expect(resolveLocale("fr")).toBe("en");
  });
});
