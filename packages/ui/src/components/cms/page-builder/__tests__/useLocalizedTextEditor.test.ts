import { renderHook, act } from "@testing-library/react";
import type { Locale } from "@acme/i18n/locales";
import useLocalizedTextEditor from "../useLocalizedTextEditor";

const getHTML = jest.fn(() => "<p>Edited</p>");

jest.mock("../useTextEditor", () => ({
  __esModule: true,
  default: () => ({
    getHTML,
  }),
}));

describe("useLocalizedTextEditor", () => {
  const component = {
    id: "1",
    text: { en: "<p>Hello</p>", fr: "<p>Bonjour</p>" },
  };

  it("startEditing sets editing true", () => {
    const { result } = renderHook(() =>
      useLocalizedTextEditor(component as any, "en" as Locale)
    );

    act(() => result.current.startEditing());

    expect(result.current.editing).toBe(true);
  });

  it("finishEditing returns patch with locale-specific HTML and resets editing", () => {
    const { result } = renderHook(() =>
      useLocalizedTextEditor(component as any, "en" as Locale)
    );

    act(() => result.current.startEditing());

    let patch;
    act(() => {
      patch = result.current.finishEditing();
    });

    expect(patch).toEqual({
      text: { en: "<p>Edited</p>", fr: "<p>Bonjour</p>" },
    });
    expect(result.current.editing).toBe(false);
  });
});

