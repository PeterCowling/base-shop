import { fireEvent, render } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { useArrayEditor } from "../useArrayEditor";

jest.mock("../ImagePicker", () => ({
  __esModule: true,
  default: ({ onSelect, children }: any) => (
    <div onClick={() => onSelect("picked")}>{children}</div>
  ),
}));

describe("useArrayEditor", () => {
  it("adds item and calls onChange", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useArrayEditor<any>(onChange));
    const renderArrayEditor = result.current;
    const { getByText, rerender, queryAllByPlaceholderText } = render(
      renderArrayEditor("images", [], ["src"])
    );

    fireEvent.click(getByText("Add"));
    expect(onChange).toHaveBeenCalledWith({ images: [{ src: "" }] });

    rerender(renderArrayEditor("images", [{ src: "" }], ["src"]));
    expect(queryAllByPlaceholderText("src")).toHaveLength(1);
  });

  it("removes item and respects minItems", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useArrayEditor<any>(onChange));
    const renderArrayEditor = result.current;
    const items = [{ src: "a" }, { src: "b" }];
    const { getAllByText, rerender } = render(
      renderArrayEditor("images", items, ["src"], { minItems: 1 })
    );

    fireEvent.click(getAllByText("Remove")[0]);
    expect(onChange).toHaveBeenCalledWith({ images: [{ src: "b" }] });

    rerender(renderArrayEditor("images", [{ src: "b" }], ["src"], { minItems: 1 }));
    expect(getAllByText("Remove")[0]).toBeDisabled();
  });

  it("disables Add button at maxItems", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useArrayEditor<any>(onChange));
    const renderArrayEditor = result.current;
    const items = [{ src: "a" }, { src: "b" }];
    const { getByText } = render(
      renderArrayEditor("images", items, ["src"], { maxItems: 2 })
    );

    expect(getByText("Add")).toBeDisabled();
  });

  it("updates src via ImagePicker", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useArrayEditor<any>(onChange));
    const renderArrayEditor = result.current;
    const { getByText } = render(
      renderArrayEditor("images", [{ src: "" }], ["src"])
    );

    fireEvent.click(getByText("Pick"));
    expect(onChange).toHaveBeenCalledWith({ images: [{ src: "picked" }] });
  });
});
