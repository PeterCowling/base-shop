import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { TranslationsProvider, useTranslations } from "../Translations";

describe("TranslationsProvider and useTranslations", () => {
  it("returns translations from provided messages", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ hello: "Hallo" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("hello")).toBe("Hallo");
  });

  it("falls back to key when translation is missing", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{}}>{children}</TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("missing")).toBe("missing");
  });

  it("memoises translator function when messages remain unchanged", () => {
    const messages = { hello: "Hallo" };
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={messages}>{children}</TranslationsProvider>
    );

    const { result, rerender } = renderHook(() => useTranslations(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("updates translations and function identity when messages change", () => {
    const wrapper = ({ children, messages }: PropsWithChildren<{ messages: Record<string, string> }>) => (
      <TranslationsProvider messages={messages}>{children}</TranslationsProvider>
    );

    const { result, rerender } = renderHook(() => useTranslations(), {
      wrapper,
      initialProps: { messages: { hello: "Hallo" } },
    });

    const first = result.current;
    expect(first("hello")).toBe("Hallo");

    rerender({ messages: { hello: "Salut" } });
    const second = result.current;
    expect(second("hello")).toBe("Salut");
    expect(second).not.toBe(first);
  });
});

