import { act,renderHook } from "@testing-library/react";

import { useConfigurator } from "../../ConfiguratorContext";
import useStepCompletion from "../useStepCompletion";

jest.mock("../../ConfiguratorContext", () => ({
  useConfigurator: jest.fn(),
}));

describe("useStepCompletion", () => {
  const markStepComplete = jest.fn();
  const resetDirty = jest.fn();
  const baseState: any = {
    completed: {},
    shopId: "id",
    storeName: "Store",
    theme: "dark",
  };

  beforeEach(() => {
    (useConfigurator as jest.Mock).mockReturnValue({
      state: { ...baseState },
      markStepComplete,
      resetDirty,
    });
    markStepComplete.mockClear();
    resetDirty.mockClear();
  });

  it("reports completion when state is complete and valid", () => {
    (useConfigurator as jest.Mock).mockReturnValue({
      state: { ...baseState, completed: { "shop-details": "complete" } },
      markStepComplete,
      resetDirty,
    });
    const { result } = renderHook(() => useStepCompletion("shop-details"));
    expect(result.current[0]).toBe(true);
  });

  it("does not mark complete if validator fails", () => {
    (useConfigurator as jest.Mock).mockReturnValue({
      state: { ...baseState, shopId: "", storeName: "" },
      markStepComplete,
      resetDirty,
    });
    const { result } = renderHook(() => useStepCompletion("shop-details"));
    act(() => result.current[1](true));
    expect(markStepComplete).not.toHaveBeenCalled();
  });

  it("marks step complete and resets dirty when valid", () => {
    const { result } = renderHook(() => useStepCompletion("shop-details"));
    act(() => result.current[1](true));
    expect(markStepComplete).toHaveBeenCalledWith("shop-details", "complete");
    expect(resetDirty).toHaveBeenCalled();
  });

  it("marks step pending when toggled off", () => {
    (useConfigurator as jest.Mock).mockReturnValue({
      state: { ...baseState, completed: { theme: "complete" } },
      markStepComplete,
      resetDirty,
    });
    const { result } = renderHook(() => useStepCompletion("theme"));
    act(() => result.current[1](false));
    expect(markStepComplete).toHaveBeenCalledWith("theme", "pending");
    expect(resetDirty).not.toHaveBeenCalled();
  });
});

