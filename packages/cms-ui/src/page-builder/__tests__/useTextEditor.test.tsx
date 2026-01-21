import { act,renderHook } from "@testing-library/react";

import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";

import useTextEditor from "../useTextEditor";

type TextComponent = PageComponent & {
  type: "Text";
  text?: string | Record<string, string>;
};

const mockSetContent = jest.fn();
const mockFocus = jest.fn();
let html = "";

jest.mock("@tiptap/react", () => ({
  useEditor: jest.fn(({ content }: { content: string }) => {
    html = content;
    return {
      commands: {
        setContent: (c: string) => {
          html = c;
          mockSetContent(c);
        },
        focus: mockFocus,
      },
      getHTML: () => html,
    };
  }),
}));

describe("useTextEditor", () => {
  const component: TextComponent = {
    id: "1",
    type: "Text",
    text: { en: "<p>Hello</p>", fr: "<p>Bonjour</p>" },
  } as TextComponent;

  beforeEach(() => {
    mockSetContent.mockClear();
    mockFocus.mockClear();
    html = "";
  });

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
    expect(mockSetContent).toHaveBeenCalledWith("<p>Bonjour</p>");
    expect(result.current?.getHTML()).toBe("<p>Bonjour</p>");
  });

  it("updates content only when not editing and focuses when editing starts", () => {
    const { rerender } = renderHook(
      ({ locale, editing }) =>
        useTextEditor(component, locale as Locale, editing),
      { initialProps: { locale: "en", editing: false } }
    );

    mockSetContent.mockClear();
    mockFocus.mockClear();

    act(() => rerender({ locale: "fr", editing: true }));
    expect(mockSetContent).not.toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalledTimes(1);

    act(() => rerender({ locale: "fr", editing: false }));
    expect(mockSetContent).toHaveBeenCalledWith("<p>Bonjour</p>");
  });

  it("falls back to primary locale when current locale is missing", () => {
    const comp: TextComponent = {
      id: "2",
      type: "Text",
      text: { en: "<p>Primary</p>" },
    } as TextComponent;

    const { result } = renderHook(() =>
      useTextEditor(comp, "fr" as Locale, false)
    );

    expect(result.current?.getHTML()).toBe("<p>Primary</p>");
  });

  it("falls back to any available locale when primary is missing", () => {
    const comp: TextComponent = {
      id: "3",
      type: "Text",
      text: { it: "<p>Ciao</p>" },
    } as TextComponent;

    const { result } = renderHook(() =>
      useTextEditor(comp, "de" as Locale, false)
    );

    expect(result.current?.getHTML()).toBe("<p>Ciao</p>");
  });
});
