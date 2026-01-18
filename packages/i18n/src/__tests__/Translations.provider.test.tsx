import { render } from "@testing-library/react";
import { TranslationsProvider, useTranslations } from "../Translations";

function Greeter() {
  const t = useTranslations();
  return <span>{t("greet")}</span>;
}

function Missing() {
  const t = useTranslations();
  return <span>{t("missing")}</span>;
}

describe("TranslationsProvider", () => {
  it("provides translations and re-renders consumers on update", () => {
    let messages: Record<string, string> = { greet: "Hallo" };
    const { rerender, getByText } = render(
      <TranslationsProvider messages={messages}>
        <Greeter />
      </TranslationsProvider>
    );
    getByText("Hallo");
    messages = { greet: "Salut" };
    rerender(
      <TranslationsProvider messages={messages}>
        <Greeter />
      </TranslationsProvider>
    );
    getByText("Salut");
  });

  it("falls back to key and warns when missing", () => {
    const original = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { getByText } = render(
      <TranslationsProvider messages={{}}>
        <Missing />
      </TranslationsProvider>
    );
    getByText("missing");
    expect(warn).toHaveBeenCalledWith("Missing translation for key: missing");
    warn.mockRestore();
    (process.env as Record<string, string | undefined>).NODE_ENV = original;
  });
});

