import { act,renderHook } from "@testing-library/react";

import useComponentInputs from "../src/components/cms/page-builder/useComponentInputs";
import useComponentResize from "../src/components/cms/page-builder/useComponentResize";

describe("component hooks", () => {
  it("useComponentInputs forwards field changes", () => {
    const onChange = jest.fn<void, [Partial<Record<string, string>>]>();
    const { result } = renderHook(() =>
      useComponentInputs<Record<string, string>>(onChange),
    );
    act(() => result.current.handleInput("foo", "bar"));
    expect(onChange).toHaveBeenCalledWith({ foo: "bar" });
  });

  it("useComponentResize trims values and sets full size", () => {
    const onResize = jest.fn();
    const { result } = renderHook(() => useComponentResize(onResize));
    act(() => result.current.handleResize("widthDesktop", " 200px "));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "200px" });
    act(() => result.current.handleResize("widthDesktop", "   "));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: undefined });
    act(() => result.current.handleFullSize("widthDesktop"));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100%" });
  });
});
