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
});

