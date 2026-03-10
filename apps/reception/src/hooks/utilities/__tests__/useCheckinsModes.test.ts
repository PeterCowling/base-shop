// src/hooks/utilities/__tests__/useCheckinsModes.test.ts
import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useCheckinsModes from "../useCheckinsModes";

describe("useCheckinsModes", () => {
  it("defaults checkinMode to idle and showArchiveModal to false", () => {
    const { result } = renderHook(() => useCheckinsModes());

    expect(result.current.checkinMode).toBe("idle");
    expect(result.current.showArchiveModal).toBe(false);
  });

  it("toggles modes exclusively", () => {
    const { result } = renderHook(() => useCheckinsModes());

    act(() => {
      result.current.toggleAddGuestMode();
    });
    expect(result.current.checkinMode).toBe("addGuest");

    act(() => {
      result.current.toggleEditMode();
    });
    expect(result.current.checkinMode).toBe("edit");

    act(() => {
      result.current.toggleDeleteMode();
    });
    expect(result.current.checkinMode).toBe("delete");

    act(() => {
      result.current.openArchiveModal();
    });
    expect(result.current.showArchiveModal).toBe(true);
    expect(result.current.checkinMode).toBe("idle");
  });

  it("toggles back to idle on second click", () => {
    const { result } = renderHook(() => useCheckinsModes());

    act(() => {
      result.current.toggleEditMode();
    });
    expect(result.current.checkinMode).toBe("edit");

    act(() => {
      result.current.toggleEditMode();
    });
    expect(result.current.checkinMode).toBe("idle");
  });

  it("openArchiveModal clears checkinMode to idle", () => {
    const { result } = renderHook(() => useCheckinsModes());

    act(() => {
      result.current.toggleDeleteMode();
    });
    expect(result.current.checkinMode).toBe("delete");

    act(() => {
      result.current.openArchiveModal();
    });
    expect(result.current.checkinMode).toBe("idle");
    expect(result.current.showArchiveModal).toBe(true);
  });
});
