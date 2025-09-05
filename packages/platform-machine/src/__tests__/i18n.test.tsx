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
    expect(result.de).toBe("Hi");
    expect(result.it).toBe("Hi");
  });

  it("preserves nested values without cloning", () => {
    const nested = { msg: "Hallo" } as any;
    const result = fillLocales({ de: nested } as any, "Hi" as any);

    expect(result.de).toBe(nested);
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
  it("exposes supported locales", () => {
    expect(LOCALES).toEqual(["en", "de", "it"]);
  });

  it("falls back to 'en' for unknown locale", () => {
    expect(resolveLocale("fr")).toBe("en");
  });
});
