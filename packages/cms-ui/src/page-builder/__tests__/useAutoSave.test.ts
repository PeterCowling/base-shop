import { act, renderHook } from "@testing-library/react";

import useAutoSave from "../hooks/useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("triggers a delayed save and resets state", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const formData = new FormData();

    const { result, rerender } = renderHook(
      ({ deps }) => useAutoSave({ onSave, formData, deps }),
      { initialProps: { deps: [0] } }
    );

    rerender({ deps: [1] });
    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(onSave).toHaveBeenCalledWith(formData);
    expect(result.current.autoSaveState).toBe("saved");

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.autoSaveState).toBe("idle");
  });

  it("handles save errors and retries", async () => {
    const onSave = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(undefined);
    const onError = jest.fn();
    const formData = new FormData();

    const { result, rerender } = renderHook(
      ({ deps }) => useAutoSave({ onSave, formData, deps, onError }),
      { initialProps: { deps: [0] } }
    );

    rerender({ deps: [1] });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.autoSaveState).toBe("error");
    expect(onError).toHaveBeenCalledTimes(1);
    const retry = onError.mock.calls[0][0];
    expect(typeof retry).toBe("function");

    await act(async () => {
      retry();
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(result.current.autoSaveState).toBe("saved");

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.autoSaveState).toBe("idle");
  });
});
