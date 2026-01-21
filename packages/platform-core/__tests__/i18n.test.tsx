import { memo } from "react";
import { render, screen } from "@testing-library/react";

import { TranslationsProvider, useTranslations } from "@acme/i18n";

describe("TranslationsProvider and useTranslations", () => {
  function Show({ k }: { k: string }) {
    const t = useTranslations();
    return <span>{t(k)}</span>;
  }

  function Capture({ onRender }: { onRender: (t: (key: string) => string) => void }) {
    const t = useTranslations();
    onRender(t);
    return null;
  }

  it("returns translations and falls back to key when missing", () => {
    render(
      <TranslationsProvider messages={{ greet: "Hello" }}>
        <>
          <Show k="greet" />
          <Show k="missing" />
        </>
      </TranslationsProvider>
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("missing")).toBeInTheDocument();
  });

  it("provides a stable translator when messages do not change", () => {
    const messages = { greet: "Hello" };
    const renders: ((key: string) => string)[] = [];

    const { rerender } = render(
      <TranslationsProvider messages={messages}>
        <Capture onRender={(t) => renders.push(t)} />
      </TranslationsProvider>
    );

    rerender(
      <TranslationsProvider messages={messages}>
        <Capture onRender={(t) => renders.push(t)} />
      </TranslationsProvider>
    );

    expect(renders[0]).toBe(renders[1]);
  });

  it("updates translator when messages change", () => {
    const renders: ((key: string) => string)[] = [];
    const { rerender } = render(
      <TranslationsProvider messages={{ greet: "Hello" }}>
        <Capture onRender={(t) => renders.push(t)} />
      </TranslationsProvider>
    );

    rerender(
      <TranslationsProvider messages={{ greet: "Hi" }}>
        <Capture onRender={(t) => renders.push(t)} />
      </TranslationsProvider>
    );

    expect(renders[0]).not.toBe(renders[1]);
    expect(renders[1]("greet")).toBe("Hi");
  });

  it("avoids re-rendering children when messages reference is unchanged", () => {
    const messages = { greet: "Hello" };
    const Child = jest.fn(() => {
      const t = useTranslations();
      return <span>{t("greet")}</span>;
    });
    const MemoChild = memo(Child);

    const { rerender } = render(
      <TranslationsProvider messages={messages}>
        <MemoChild />
      </TranslationsProvider>
    );

    expect(Child).toHaveBeenCalledTimes(1);

    rerender(
      <TranslationsProvider messages={messages}>
        <MemoChild />
      </TranslationsProvider>
    );

    expect(Child).toHaveBeenCalledTimes(1);
  });
});

