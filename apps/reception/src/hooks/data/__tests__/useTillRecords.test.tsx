// src/hooks/data/__tests__/useTillRecords.test.tsx
/* eslint-disable no-var */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { tillRecordMapSchema } from "../../../schemas/tillRecordSchema";

type Snap = {
  exists: () => boolean;
  val: () => unknown;
};
type FirebaseError = unknown;

// ---------- hoist‑safe placeholders ---------------------------
var snapCb: ((snap: Snap) => void) | null = null;
var errCb: ((err: FirebaseError) => void) | null = null;
var refMock: ReturnType<typeof vi.fn>;
var onValueMock: ReturnType<typeof vi.fn>;
var offMock: ReturnType<typeof vi.fn>;
var updateMock: ReturnType<typeof vi.fn>;
// --------------------------------------------------------------

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

vi.mock("firebase/database", () => {
  refMock = vi.fn((_db: unknown, path: string) => ({ path }));
  onValueMock = vi.fn(
    (
      _ref: unknown,
      cb: (snap: Snap) => void,
      err?: (err: FirebaseError) => void
    ) => {
      snapCb = cb;
      errCb = err || null;
      return () => undefined;
    }
  );
  offMock = vi.fn();
  updateMock = vi.fn(() => Promise.resolve());
  return {
    getDatabase: vi.fn(() => ({})),
    ref: refMock,
    onValue: onValueMock,
    off: offMock,
    update: updateMock,
  };
});

import useTillRecords from "../useTillRecords";

describe("useTillRecords", () => {
  afterEach(() => {
    vi.clearAllMocks();
    snapCb = null;
    errCb = null;
  });

  it("sets tillRecords from snapshot", () => {
    const { result } = renderHook(() => useTillRecords());

    act(() => {
      snapCb?.({ exists: () => true, val: () => ({ r1: { amount: 5 } }) });
    });

    expect(result.current.tillRecords).toEqual({ r1: { amount: 5 } });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles firebase errors", () => {
    const { result } = renderHook(() => useTillRecords());

    act(() => {
      errCb?.("fail");
    });

    expect(result.current.error).toBe("fail");
    expect(result.current.loading).toBe(false);
  });

  it("retains last good data and exposes validation error on invalid snapshot", () => {
    const { result } = renderHook(() => useTillRecords());

    act(() => {
      snapCb?.({ exists: () => true, val: () => ({ r1: { amount: 5 } }) });
    });

    const invalidData = { r2: { extra: 1 } };
    const parseResult = tillRecordMapSchema.safeParse(invalidData);

    act(() => {
      snapCb?.({ exists: () => true, val: () => invalidData });
    });

    expect(result.current.error).toBeInstanceOf(ZodError);
    expect((result.current.error as ZodError).issues).toEqual(
      parseResult.error.issues
    );
    expect(result.current.tillRecords).toEqual({ r1: { amount: 5 } });
  });

  it("saveTillRecord updates correct path", async () => {
    const { result } = renderHook(() => useTillRecords());

    await act(async () => {
      await result.current.saveTillRecord("rec1", { amount: 9 });
    });

    expect(refMock).toHaveBeenCalledWith({}, "tillRecords/rec1");
    expect(updateMock).toHaveBeenCalledWith(
      { path: "tillRecords/rec1" },
      { amount: 9 }
    );
  });
});
