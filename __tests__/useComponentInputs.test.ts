import { renderHook, act } from "@testing-library/react";
import { useComponentInputs } from "@ui";

type FormValues = {
  title: string;
  count: number;
};

describe("useComponentInputs", () => {
  it("forwards field changes with correct typing", () => {
    const onChange = jest.fn<(patch: Partial<FormValues>) => void>();
    const { result } = renderHook(() => useComponentInputs<FormValues>(onChange));

    act(() => result.current.handleInput("title", "hello"));
    expect(onChange).toHaveBeenCalledWith({ title: "hello" });

    act(() => result.current.handleInput("count", 2));
    expect(onChange).toHaveBeenCalledWith({ count: 2 });

     
    // @ts-expect-error - field must exist on FormValues
    result.current.handleInput("missing", "value");

     
    // @ts-expect-error - value type must match field type
    result.current.handleInput("count", "not-a-number");
  });
});
