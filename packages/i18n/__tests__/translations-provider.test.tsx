import { render, screen } from "@testing-library/react";
import { TranslationsProvider, useTranslations } from "../src/Translations";
import type { ReactNode } from "react";

describe("TranslationsProvider and useTranslations", () => {
  function Show({ tKey }: { tKey: string }): React.JSX.Element {
    const t = useTranslations();
    return <span>{t(tKey)}</span>;
  }

  it("renders an existing translation", () => {
    render(
      <TranslationsProvider messages={{ welcome: "Welcome!" }}>
        <Show tKey="welcome" />
      </TranslationsProvider>
    );

    expect(screen.getByText("Welcome!")).toBeInTheDocument();
  });

  it("falls back to the key and warns when a translation is missing", () => {
    const original = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <TranslationsProvider messages={{}}>
        <Show tKey="welcome" />
      </TranslationsProvider>
    );

    expect(screen.getByText("welcome")).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      "Missing translation for key: welcome"
    );

    warnSpy.mockRestore();
    (process.env as Record<string, string | undefined>).NODE_ENV = original;
  });

  it("memoises the translation function and updates when messages change", () => {
    const record = jest.fn();

    function Consumer({
      children,
    }: {
      children?: ReactNode;
    }): React.JSX.Element {
      const t = useTranslations();
      record(t);
      return <>{children}</>;
    }

    const messages = { hello: "Hallo" };
    const { rerender } = render(
      <TranslationsProvider messages={messages}>
        <Consumer />
      </TranslationsProvider>
    );

    const firstFn = record.mock.calls[0][0];

    rerender(
      <TranslationsProvider messages={messages}>
        <Consumer />
      </TranslationsProvider>
    );

    const secondFn = record.mock.calls[1][0];
    expect(secondFn).toBe(firstFn);

    rerender(
      <TranslationsProvider messages={{ hello: "Bonjour" }}>
        <Consumer />
      </TranslationsProvider>
    );

    const thirdFn = record.mock.calls[2][0];
    expect(thirdFn).not.toBe(firstFn);
  });

  it("re-renders consumers with updated translations", () => {
    const { rerender } = render(
      <TranslationsProvider messages={{ hello: "Hallo" }}>
        <Show tKey="hello" />
      </TranslationsProvider>
    );

    expect(screen.getByText("Hallo")).toBeInTheDocument();

    rerender(
      <TranslationsProvider messages={{ hello: "Bonjour" }}>
        <Show tKey="hello" />
      </TranslationsProvider>
    );

    expect(screen.getByText("Bonjour")).toBeInTheDocument();
  });
});
