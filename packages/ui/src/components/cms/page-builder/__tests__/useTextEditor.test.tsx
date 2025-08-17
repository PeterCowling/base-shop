import { renderHook, act } from "@testing-library/react";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import useTextEditor from "../useTextEditor";

describe("useTextEditor", () => {
  const component = {
    id: "1",
    type: "Text",
    text: { en: "<p>Hello</p>", fr: "<p>Bonjour</p>" },
  } as unknown as PageComponent;

  it("initializes editor with locale content", () => {
    const { result } = renderHook(() =>
      useTextEditor(component, "en" as Locale, false)
    );
    expect(result.current?.getHTML()).toBe("<p>Hello</p>");
  });

  it("updates content when locale changes", () => {
    const { result, rerender } = renderHook(
      ({ locale }) => useTextEditor(component, locale as Locale, false),
      { initialProps: { locale: "en" } }
    );
    expect(result.current?.getHTML()).toBe("<p>Hello</p>");
    act(() => rerender({ locale: "fr" }));
    expect(result.current?.getHTML()).toBe("<p>Bonjour</p>");
  });
});
