import { renderHook, act } from "@testing-library/react";
import useAutoSave from "../src/components/cms/page-builder/hooks/useAutoSave";

describe("useAutoSave state transitions", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("transitions idle -> saving -> saved on success", async () => {
    let resolveSave: () => void;
    const onSave = jest.fn(
      () => new Promise<void>((resolve) => {
        resolveSave = resolve;
      })
    );
    const formData = new FormData();
    const { result, rerender } = renderHook(({ deps }) =>
      useAutoSave({ onSave, formData, deps })
    , { initialProps: { deps: [0] } });

    expect(result.current.autoSaveState).toBe("idle");

    rerender({ deps: [1] });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.autoSaveState).toBe("saving");
    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave();
    });

    expect(result.current.autoSaveState).toBe("saved");

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.autoSaveState).toBe("idle");
  });

  it("transitions idle -> saving -> error and calls onError on failure", async () => {
    let rejectSave: (reason?: unknown) => void;
    const onSave = jest.fn(
      () => new Promise((_, reject) => {
        rejectSave = reject;
      })
    );
    const onError = jest.fn();
    const formData = new FormData();
    const { result, rerender } = renderHook(({ deps }) =>
      useAutoSave({ onSave, formData, deps, onError })
    , { initialProps: { deps: [0] } });

    expect(result.current.autoSaveState).toBe("idle");

    rerender({ deps: [1] });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.autoSaveState).toBe("saving");
    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      rejectSave(new Error("fail"));
    });

    expect(result.current.autoSaveState).toBe("error");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(typeof onError.mock.calls[0][0]).toBe("function");
  });

  it("transitions to error without onError callback", async () => {
    let rejectSave: (reason?: unknown) => void;
    const onSave = jest.fn(
      () => new Promise((_, reject) => {
        rejectSave = reject;
      })
    );
    const formData = new FormData();
    const { result, rerender } = renderHook(({ deps }) =>
      useAutoSave({ onSave, formData, deps })
    , { initialProps: { deps: [0] } });

    rerender({ deps: [1] });
    rerender({ deps: [2] });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await act(async () => {
      rejectSave(new Error("fail"));
    });

    expect(result.current.autoSaveState).toBe("error");
  });
});

