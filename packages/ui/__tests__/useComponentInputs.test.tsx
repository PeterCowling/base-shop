import { renderHook, act } from "@testing-library/react";
import type { PageComponent } from "@acme/types";
import { useComponentInputs } from "../src/components/cms/page-builder/useComponentInputs";

describe("useComponentInputs", () => {
  it("patches fields via onChange", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useComponentInputs(onChange));
    act(() => result.current("title", "test"));
    expect(onChange).toHaveBeenCalledWith({ title: "test" } as Partial<PageComponent>);
  });
});

