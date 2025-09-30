import { fireEvent, render } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { useArrayEditor } from "../useArrayEditor";
import { TranslationsProvider } from "@acme/i18n";
// Minimal i18n messages to avoid JSON import in Jest ESM mode
const messages = {
  "actions.add": "Add",
  "actions.remove": "Remove",
} as const;

jest.mock("../ImagePicker", () => ({
  __esModule: true,
  default: ({ onSelect, children }: any) => (
    <button
      type="button"
      onClick={() => onSelect("picked")}
      onKeyDown={(e: any) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect("picked");
        }
      }}
    >
      {children}
    </button>
  ),
}));

describe("useArrayEditor", () => {
  it("adds item and calls onChange", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useArrayEditor<any>(onChange));
    const renderArrayEditor = result.current;
    const { getByText, rerender, queryAllByPlaceholderText } = render(
      <TranslationsProvider messages={messages as any}>
        {renderArrayEditor("images", [], ["src"]) as any}
      </TranslationsProvider>
    );

    fireEvent.click(getByText("Add"));
    expect(onChange).toHaveBeenCalledWith({ images: [{ src: "" }] });

    rerender(
      <TranslationsProvider messages={messages as any}>
        {renderArrayEditor("images", [{ src: "" }], ["src"]) as any}
      </TranslationsProvider>
    );
    expect(queryAllByPlaceholderText("src")).toHaveLength(1);
  });

  it("removes item and respects minItems", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useArrayEditor<any>(onChange));
    const renderArrayEditor = result.current;
    const items = [{ src: "a" }, { src: "b" }];
    const { getAllByText, rerender } = render(
      <TranslationsProvider messages={messages as any}>
        {renderArrayEditor("images", items, ["src"], { minItems: 1 }) as any}
      </TranslationsProvider>
    );

    fireEvent.click(getAllByText("Remove")[0]);
    expect(onChange).toHaveBeenCalledWith({ images: [{ src: "b" }] });

    rerender(
      <TranslationsProvider messages={messages as any}>
        {renderArrayEditor("images", [{ src: "b" }], ["src"], { minItems: 1 }) as any}
      </TranslationsProvider>
    );
    expect(getAllByText("Remove")[0]).toBeDisabled();
  });

  it("disables Add button at maxItems", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useArrayEditor<any>(onChange));
    const renderArrayEditor = result.current;
    const items = [{ src: "a" }, { src: "b" }];
    const { getByText } = render(
      <TranslationsProvider messages={messages as any}>
        {renderArrayEditor("images", items, ["src"], { maxItems: 2 }) as any}
      </TranslationsProvider>
    );

    expect(getByText("Add")).toBeDisabled();
  });

  it("updates src via ImagePicker", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useArrayEditor<any>(onChange));
    const renderArrayEditor = result.current;
    const { getByText } = render(
      <TranslationsProvider messages={messages as any}>
        {renderArrayEditor("images", [{ src: "" }], ["src"]) as any}
      </TranslationsProvider>
    );

    fireEvent.click(getByText("Pick"));
    expect(onChange).toHaveBeenCalledWith({ images: [{ src: "picked" }] });
  });
});
