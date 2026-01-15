// src/hooks/utilities/__tests__/useCheckinsModes.test.ts
/* eslint-env vitest */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useCheckinsModes from "../useCheckinsModes";

describe("useCheckinsModes", () => {
  it("defaults all modes to false", () => {
    const { result } = renderHook(() => useCheckinsModes());

    expect(result.current.isAddGuestMode).toBe(false);
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.isDeleteMode).toBe(false);
    expect(result.current.showArchiveModal).toBe(false);
  });

  it("toggles modes exclusively", () => {
    const { result } = renderHook(() => useCheckinsModes());

    act(() => {
      result.current.toggleAddGuestMode();
    });
    expect(result.current.isAddGuestMode).toBe(true);
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.isDeleteMode).toBe(false);

    act(() => {
      result.current.toggleEditMode();
    });
    expect(result.current.isAddGuestMode).toBe(false);
    expect(result.current.isEditMode).toBe(true);
    expect(result.current.isDeleteMode).toBe(false);

    act(() => {
      result.current.toggleDeleteMode();
    });
    expect(result.current.isAddGuestMode).toBe(false);
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.isDeleteMode).toBe(true);

    act(() => {
      result.current.openArchiveModal();
    });
    expect(result.current.showArchiveModal).toBe(true);
    expect(result.current.isAddGuestMode).toBe(false);
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.isDeleteMode).toBe(false);
  });
});
