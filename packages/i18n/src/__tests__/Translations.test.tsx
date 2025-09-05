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

  it("falls back to default language when key missing", () => {
    const en = { hello: "Hello", bye: "Goodbye" };
    const de = { hello: "Hallo" };
    const messages = { ...en, ...de };
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={messages}>{children}</TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("bye")).toBe("Goodbye");
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
    // Use a closure variable for messages since the `renderHook` wrapper option
    // does not support receiving custom props. Updating this variable and
    // calling `rerender` will trigger the provider to receive the new
    // messages.
    let messages: Record<string, string> = { hello: "Hallo" };
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={messages}>{children}</TranslationsProvider>
    );

    const { result, rerender } = renderHook(() => useTranslations(), { wrapper });

    const first = result.current;
    expect(first("hello")).toBe("Hallo");

    messages = { hello: "Salut" };
    rerender();
    const second = result.current;
    expect(second("hello")).toBe("Salut");
    expect(second).not.toBe(first);
  });
});

