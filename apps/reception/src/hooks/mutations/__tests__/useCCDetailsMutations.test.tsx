import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useCCDetailsMutations from "../useCCDetailsMutations";

/* eslint-disable no-var */
var database: unknown;
var setMock: ReturnType<typeof vi.fn>;
var refMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

vi.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

beforeEach(() => {
  database = {};
  setMock = vi.fn();
  refMock = vi.fn((db: unknown, path: string) => path);
});

describe("useCCDetailsMutations", () => {
  it("writes cc details to firebase", async () => {
    const { result } = renderHook(() => useCCDetailsMutations());

    await act(async () => {
      await result.current.saveCCDetails("BR1", "occ1", {
        ccNum: "4111",
        expDate: "12/30",
      });
    });

    expect(refMock).toHaveBeenCalledWith(database, "cc/BR1/occ1");
    expect(setMock).toHaveBeenCalledWith("cc/BR1/occ1", {
      ccNum: "4111",
      expDate: "12/30",
    });
  });

  it("updates error state when set fails", async () => {
    const err = new Error("fail");
    setMock.mockRejectedValue(err);
    const { result } = renderHook(() => useCCDetailsMutations());

    await act(async () => {
      await expect(
        result.current.saveCCDetails("BRX", "occX", {
          ccNum: "1",
          expDate: "2",
        })
      ).rejects.toThrow("fail");
    });

    await waitFor(() => expect(result.current.error).toBe(err));
  });
});
