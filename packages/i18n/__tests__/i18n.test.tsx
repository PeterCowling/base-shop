// packages/i18n/__tests__/i18n.test.tsx

import { render, screen } from "@testing-library/react";
import { resolveLocale } from "../src/locales";
import { TranslationsProvider, useTranslations } from "../src/Translations";

describe("resolveLocale", () => {
  it("returns the locale if supported", () => {
    expect(resolveLocale("de")).toBe("de");
    expect(resolveLocale("it")).toBe("it");
  });

  it("returns 'en' for English locale", () => {
    expect(resolveLocale("en")).toBe("en");
  });

  it("falls back to 'en'", () => {
    expect(resolveLocale("fr")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });
});

describe("Translations context", () => {
  function ShowMessage({ k }: { k: string }) {
    const t = useTranslations();
    return <span>{t(k)}</span>;
  }

  it("provides messages via context", () => {
    render(
      <TranslationsProvider messages={{ hello: "Hallo" }}>
        <ShowMessage k="hello" />
      </TranslationsProvider>
    );
    expect(screen.getByText("Hallo")).toBeInTheDocument();
  });

  it("falls back to the key when missing", () => {
    render(
      <TranslationsProvider messages={{}}>
        <ShowMessage k="missing" />
      </TranslationsProvider>
    );
    expect(screen.getByText("missing")).toBeInTheDocument();
  });
});

describe("Translations integration", () => {
  function Greeting() {
    const t = useTranslations();
    return <div>{t("greet")}</div>;
  }

  function ShowMessage({ k }: { k: string }) {
    const t = useTranslations();
    return <span>{t(k)}</span>;
  }

  it("renders localized string", () => {
    render(
      <TranslationsProvider messages={{ greet: "Hello" }}>
        <Greeting />
      </TranslationsProvider>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("updates when locale changes", () => {
    const { rerender } = render(
      <TranslationsProvider messages={{ greet: "Hello" }}>
        <Greeting />
      </TranslationsProvider>
    );

    rerender(
      <TranslationsProvider messages={{ greet: "Hallo" }}>
        <Greeting />
      </TranslationsProvider>
    );

    expect(screen.getByText("Hallo")).toBeInTheDocument();
  });

  it("nests providers without merging messages", () => {
    render(
      <TranslationsProvider
        messages={{ greet: "Parent", parentOnly: "Parent" }}
      >
        <TranslationsProvider messages={{ greet: "Child" }}>
          <>
            <Greeting />
            <ShowMessage k="parentOnly" />
          </>
        </TranslationsProvider>
      </TranslationsProvider>
    );

    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(screen.getByText("parentOnly")).toBeInTheDocument();
  });
});
