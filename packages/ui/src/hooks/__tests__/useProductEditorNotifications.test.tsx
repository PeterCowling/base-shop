import { act, renderHook } from "@testing-library/react";
import { useProductEditorNotifications } from "../useProductEditorNotifications";

describe("useProductEditorNotifications", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("opens the toast when saving starts", () => {
    const { result, rerender } = renderHook(
      ({ saving, hasErrors }: { saving: boolean; hasErrors: boolean }) =>
        useProductEditorNotifications({ saving, hasErrors }),
      { initialProps: { saving: false, hasErrors: false } },
    );

    expect(result.current.toast.open).toBe(false);

    rerender({ saving: true, hasErrors: false });

    expect(result.current.toast.open).toBe(true);
    expect(result.current.toast.message).toBe("Saving product…");
  });

  it("shows success or error messages when saving finishes", () => {
    const { result, rerender } = renderHook(
      ({ saving, hasErrors }: { saving: boolean; hasErrors: boolean }) =>
        useProductEditorNotifications({ saving, hasErrors }),
      { initialProps: { saving: true, hasErrors: false } },
    );

    rerender({ saving: false, hasErrors: false });
    expect(result.current.toast.message).toBe("Product saved successfully.");

    rerender({ saving: true, hasErrors: false });
    rerender({ saving: false, hasErrors: true });
    expect(result.current.toast.message).toBe(
      "We couldn't save your changes. Check the highlighted sections.",
    );
  });

  it("automatically closes the toast after the timeout", () => {
    const { result } = renderHook(() =>
      useProductEditorNotifications({ saving: true, hasErrors: false, autoCloseMs: 1000 }),
    );

    expect(result.current.toast.open).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.toast.open).toBe(false);
  });

  it("exposes closeToast to manually hide", () => {
    const { result } = renderHook(() =>
      useProductEditorNotifications({ saving: true, hasErrors: false, autoCloseMs: 10000 }),
    );

    expect(result.current.toast.open).toBe(true);

    act(() => {
      result.current.closeToast();
    });

    expect(result.current.toast.open).toBe(false);
  });

  it("cleans up timeout subscription on unmount", () => {
    const clearSpy = jest.spyOn(window, "clearTimeout");
    const { unmount } = renderHook(() =>
      useProductEditorNotifications({ saving: true, hasErrors: false, autoCloseMs: 5000 }),
    );

    // Unmount while timer active triggers cleanup
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
