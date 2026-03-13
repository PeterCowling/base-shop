import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useSetFridgeUsedMutation from "../useSetFridgeUsedMutation";

/* eslint-disable no-var */
var database: unknown;
var refMock: jest.Mock;
var updateMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

beforeEach(() => {
  database = {};
  refMock = jest.fn((_db: unknown, path?: string) => path ?? "");
  updateMock = jest.fn().mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("useSetFridgeUsedMutation", () => {
  it("calls update with fridgeStorage/<occupantId> and { used: true }", async () => {
    const { result } = renderHook(() => useSetFridgeUsedMutation());

    await act(async () => {
      await result.current.setFridgeUsed("occ_1", true);
    });

    expect(refMock).toHaveBeenCalledWith(database, "fridgeStorage/occ_1");
    expect(updateMock).toHaveBeenCalledWith("fridgeStorage/occ_1", { used: true });
  });

  it("calls update with { used: false } when toggling off", async () => {
    const { result } = renderHook(() => useSetFridgeUsedMutation());

    await act(async () => {
      await result.current.setFridgeUsed("occ_1", false);
    });

    expect(updateMock).toHaveBeenCalledWith("fridgeStorage/occ_1", { used: false });
  });

  it("re-throws when update rejects", async () => {
    const firebaseError = new Error("Firebase write failed");
    updateMock.mockRejectedValueOnce(firebaseError);

    const { result } = renderHook(() => useSetFridgeUsedMutation());

    await expect(
      act(async () => {
        await result.current.setFridgeUsed("occ_1", true);
      })
    ).rejects.toThrow("Firebase write failed");
  });
});
