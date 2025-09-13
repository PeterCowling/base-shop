import { render, screen } from "@testing-library/react";
import { TranslationsProvider, useTranslations } from "../src/Translations";

function Show({ tKey }: { tKey: string }): React.JSX.Element {
  const t = useTranslations();
  return <span>{t(tKey)}</span>;
}

describe("Translations", () => {
  it("renders text in selected locale", () => {
    render(
      <TranslationsProvider messages={{ greeting: "Hallo" }}>
        <Show tKey="greeting" />
      </TranslationsProvider>
    );

    expect(screen.getByText("Hallo")).toBeInTheDocument();
  });

  it("falls back to default when key missing", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <TranslationsProvider messages={{}}>
        <Show tKey="missing" />
      </TranslationsProvider>
    );

    expect(screen.getByText("missing")).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      "Missing translation for key: missing"
    );

    warnSpy.mockRestore();
    process.env.NODE_ENV = original;
  });

  it("switching locale re-renders content", () => {
    const { rerender } = render(
      <TranslationsProvider messages={{ greeting: "Hallo" }}>
        <Show tKey="greeting" />
      </TranslationsProvider>
    );

    screen.getByText("Hallo");

    rerender(
      <TranslationsProvider messages={{ greeting: "Bonjour" }}>
        <Show tKey="greeting" />
      </TranslationsProvider>
    );

    expect(screen.getByText("Bonjour")).toBeInTheDocument();
  });
});

