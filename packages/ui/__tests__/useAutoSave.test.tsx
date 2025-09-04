import { renderHook, act } from "@testing-library/react";
import useAutoSave from "../src/components/cms/page-builder/hooks/useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("debounces saving and resets state", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const formData = new FormData();
    const { result, rerender } = renderHook(({ deps }) =>
      useAutoSave({ onSave, formData, deps })
    , { initialProps: { deps: [0] } });

    rerender({ deps: [1] });
    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.autoSaveState).toBe("saved");

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.autoSaveState).toBe("idle");
  });

  it("cleans up pending timeout on unmount", () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const formData = new FormData();
    const { rerender, unmount } = renderHook(({ deps }) =>
      useAutoSave({ onSave, formData, deps })
    , { initialProps: { deps: [0] } });

    rerender({ deps: [1] });
    unmount();

    act(() => {
      jest.runAllTimers();
    });

    expect(onSave).not.toHaveBeenCalled();
  });
});
