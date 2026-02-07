// src/hooks/data/__tests__/useActivitiesByCodeData.test.ts
/* eslint-env vitest */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* Import the hook under test AFTER mocks are in place */
import useActivitiesByCodeData from "../useActivitiesByCodeData";

vi.mock("../../../services/useFirebase", () => ({
  // Overwrite every export we need; nothing inside will execute `getDatabase`
  useFirebaseDatabase: () => ({}),
}));

type Snap = {
  exists: () => boolean;
  val: () => unknown;
};

/* ---------- hoist‑safe placeholders ------------------------------- */
/* eslint-disable no-var */
var callbacks: Array<(snap: Snap) => void> = [];
var onValueMock: ReturnType<typeof vi.fn>;
var refMock: ReturnType<typeof vi.fn>;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  firebase/database mock                                             */
/* ------------------------------------------------------------------ */
vi.mock("firebase/database", () => {
  callbacks = [];

  refMock = vi.fn((_db: unknown, path: string) => ({ path }));
  onValueMock = vi.fn(
    (
      _ref: unknown,
      cb: (snap: Snap) => void,
      _err?: (err: unknown) => void
    ) => {
      callbacks.push(cb);
      return vi.fn(); // unsubscribe
    }
  );

  /* <-- NEW: stub getDatabase so any accidental call is harmless */
  function getDatabase() {
    return {}; // minimal dummy object
  }

  return {
    ref: refMock,
    onValue: onValueMock,
    getDatabase,
  };
});

afterEach(() => {
  vi.clearAllMocks();
  callbacks = [];
});

describe("useActivitiesByCodeData", () => {
  it("updates state for each code", async () => {
    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [2, 1] })
    );

    expect(callbacks).toHaveLength(2);
    expect(refMock).toHaveBeenCalledWith({}, "activitiesByCode/1");
    expect(refMock).toHaveBeenCalledWith({}, "activitiesByCode/2");

    const snap1: Snap = {
      exists: () => true,
      val: () => ({ occ1: { act1: { who: "sys" } } }),
    };
    const snap2: Snap = { exists: () => false, val: () => null };

    act(() => {
      callbacks[0](snap1);
      callbacks[1](snap2);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.activitiesByCodes).toEqual({
      "1": { occ1: { act1: { who: "sys" } } },
      "2": {},
    });
    expect(result.current.error).toBeNull();
  });

  it("honors skip flag", () => {
    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [1], skip: true })
    );

    expect(onValueMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.activitiesByCodes).toEqual({});
  });
});
