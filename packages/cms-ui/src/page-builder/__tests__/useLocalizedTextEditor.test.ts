import { act,renderHook } from "@testing-library/react";

import type { Locale } from "@acme/i18n/locales";

import useLocalizedTextEditor from "../useLocalizedTextEditor";

const getHTML = jest.fn(() => "<p>Edited</p>");
const mockUseTextEditor = jest.fn();

jest.mock("../useTextEditor", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseTextEditor(...args),
}));

beforeEach(() => {
  mockUseTextEditor.mockReset();
  mockUseTextEditor.mockReturnValue({ getHTML });
});

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

  it("finishEditing returns null when editor is missing", () => {
    mockUseTextEditor.mockReturnValue(null);

    const { result } = renderHook(() =>
      useLocalizedTextEditor(component as any, "en" as Locale)
    );

    act(() => result.current.startEditing());

    let patch;
    act(() => {
      patch = result.current.finishEditing();
    });

    expect(patch).toBeNull();
  });

  it("finishEditing merges locale into text and resets editing", () => {
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

