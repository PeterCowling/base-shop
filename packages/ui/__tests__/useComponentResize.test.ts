import { act,renderHook } from "@testing-library/react";

import useComponentResize from "../src/components/cms/page-builder/useComponentResize";

describe("useComponentResize", () => {
  it("trims whitespace and handles empty values", () => {
    const onResize = jest.fn();
    const { result } = renderHook(() => useComponentResize(onResize));

    act(() => result.current.handleResize("widthDesktop", " 200px "));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "200px" });

    act(() => result.current.handleResize("widthDesktop", "   "));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: undefined });

    act(() => result.current.handleResize("widthDesktop", ""));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: undefined });
  });

  it("sets full size to 100%", () => {
    const onResize = jest.fn();
    const { result } = renderHook(() => useComponentResize(onResize));

    act(() => result.current.handleFullSize("widthDesktop"));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100%" });
  });
});
