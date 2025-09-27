// packages/i18n/__tests__/i18n.test.tsx

import { render, screen } from "@testing-library/react";
import { memo } from "react";
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

  it("provides messages via context", async () => {
    render(
      <TranslationsProvider messages={{ hello: "Hallo" }}>
        <ShowMessage k="hello" />
      </TranslationsProvider>
    );
    expect(await screen.findByText("Hallo")).toBeInTheDocument();
  });

  it("falls back to the key when missing", async () => {
    render(
      <TranslationsProvider messages={{}}>
        <ShowMessage k="missing" />
      </TranslationsProvider>
    );
    expect(await screen.findByText("missing")).toBeInTheDocument();
  });
});

describe("useTranslations hook", () => {
  function Hooked({ k }: { k: string }) {
    const t = useTranslations();
    return <span>{t(k)}</span>;
  }

  it("returns translation when present and key when missing", async () => {
    const { rerender } = render(
      <TranslationsProvider messages={{ hello: "Hallo" }}>
        <Hooked k="hello" />
      </TranslationsProvider>
    );

    expect(await screen.findByText("Hallo")).toBeInTheDocument();

    rerender(
      <TranslationsProvider messages={{}}>
        <Hooked k="hello" />
      </TranslationsProvider>
    );

    expect(await screen.findByText("hello")).toBeInTheDocument();
  });

  it("falls back to key outside a provider", async () => {
    render(<Hooked k="missing" />);
    expect(await screen.findByText("missing")).toBeInTheDocument();
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

  it("renders localized string", async () => {
    render(
      <TranslationsProvider messages={{ greet: "Hello" }}>
        <Greeting />
      </TranslationsProvider>
    );
    expect(await screen.findByText("Hello")).toBeInTheDocument();
  });

  it("updates when locale changes", async () => {
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

    expect(await screen.findByText("Hallo")).toBeInTheDocument();
  });

  it("nests providers without merging messages", async () => {
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

    expect(await screen.findByText("Child")).toBeInTheDocument();
    expect(await screen.findByText("parentOnly")).toBeInTheDocument();
  });
});

describe("TranslationsProvider memoisation", () => {
  it("preserves messages reference between renders", async () => {
    const renderSpy = jest.fn();
    const Child = memo(function Child() {
      const t = useTranslations();
      renderSpy();
      return <span>{t("hello")}</span>;
    });

    const messages = { hello: "Hallo" };
    const { rerender } = render(
      <TranslationsProvider messages={messages}>
        <Child />
      </TranslationsProvider>
    );

    expect(renderSpy).toHaveBeenCalledTimes(1);

    rerender(
      <TranslationsProvider messages={messages}>
        <Child />
      </TranslationsProvider>
    );

    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Hallo")).toBeInTheDocument();
  });
});
