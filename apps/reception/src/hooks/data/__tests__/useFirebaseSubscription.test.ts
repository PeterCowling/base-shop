import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";

import { getErrorMessage } from "../../../utils/errorMessage";
import { showToast } from "../../../utils/toastUtils";

interface MockSnapshot {
  exists: () => boolean;
  val: () => unknown;
}

/* eslint-disable no-var */
var cb: ((snap: MockSnapshot) => void) | null = null;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({})
}));

jest.mock("firebase/database", () => ({
  ref: jest.fn(() => ({})),
  onValue: jest.fn((_: unknown, onData: (snap: MockSnapshot) => void) => {
    cb = onData;
    return () => undefined;
  }),
  off: jest.fn()
}));

jest.mock("../../../utils/toastUtils", () => {
  const toastMock = jest.fn();
  return { showToast: toastMock };
});

import useFirebaseSubscription from "../useFirebaseSubscription";
const toastMock = showToast as unknown as jest.Mock;

describe("useFirebaseSubscription", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cb = null;
  });

  it("parses data with provided schema", () => {
    const { result } = renderHook(() =>
      useFirebaseSubscription<number>("test", z.number())
    );
    act(() => {
      cb?.({ exists: () => true, val: () => 5 });
    });
    expect(result.current.data).toBe(5);
    expect(result.current.error).toBeNull();
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("retains previous data and shows toast on invalid snapshot", () => {
    const { result } = renderHook(() =>
      useFirebaseSubscription<number>("test", z.number())
    );
    act(() => {
      cb?.({ exists: () => true, val: () => 10 });
    });
    expect(result.current.data).toBe(10);
    const parsed = z.number().safeParse("bad");
    const expected = getErrorMessage(parsed.error);
    act(() => {
      cb?.({ exists: () => true, val: () => "bad" });
    });
    expect(toastMock).toHaveBeenCalledWith(expected, "error");
    expect(result.current.data).toBe(10);
  });
});

