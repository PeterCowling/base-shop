import type { PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";

import { TranslationsProvider, useTranslations } from "../Translations";

describe("useTranslations edge cases", () => {
  it("returns key when used without provider", () => {
    const { result } = renderHook(() => useTranslations());
    expect(result.current("missing"))
      .toBe("missing");
  });

  it("falls back to key when messages are for an unsupported locale", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ es: { greet: "Hola" } } as any}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("greet"))
      .toBe("greet");
  });

  it("does not interpolate placeholders in messages", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{ greet: "Hi {name}" }}>
        {children}
      </TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("greet"))
      .toBe("Hi {name}");
  });

  it("returns key string for missing keys", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TranslationsProvider messages={{}}>{children}</TranslationsProvider>
    );

    const { result } = renderHook(() => useTranslations(), { wrapper });
    expect(result.current("unknown"))
      .toBe("unknown");
    expect(result.current("unknown"))
      .not.toBe("");
  });
});

