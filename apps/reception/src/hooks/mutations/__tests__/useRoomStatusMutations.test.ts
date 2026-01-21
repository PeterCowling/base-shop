import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";

import useRoomStatusMutations from "../useRoomStatusMutations";

let database: unknown;
let refMock: jest.Mock;
let updateMock: jest.Mock;
let removeMock: jest.Mock;

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
  remove: (...args: unknown[]) => removeMock(...args),
}));

beforeEach(() => {
  database = {};
  refMock = jest.fn((_db: unknown, path?: string) => path ?? "");
  updateMock = jest.fn();
  removeMock = jest.fn();
});

describe("useRoomStatusMutations", () => {
  it("updates room status", async () => {
    updateMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useRoomStatusMutations());

    await act(async () => {
      await result.current.saveRoomStatus("101", { clean: "true" });
    });

    expect(updateMock).toHaveBeenCalledWith("roomStatus/101", { clean: "true" });
    expect(result.current.error).toBeNull();
  });

  it("records error on update failure", async () => {
    const err = new Error("fail");
    updateMock.mockRejectedValue(err);
    const { result } = renderHook(() => useRoomStatusMutations());

    await act(async () => {
      await expect(
        result.current.saveRoomStatus("101", {})
      ).rejects.toThrow("fail");
    });
    expect(result.current.error).toBe(err);
  });

  it("removes room status", async () => {
    removeMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useRoomStatusMutations());

    await act(async () => {
      await result.current.removeRoomStatus("101");
    });
    expect(removeMock).toHaveBeenCalledWith("roomStatus/101");
  });

  it("records error on remove failure", async () => {
    const err = new Error("fail");
    removeMock.mockRejectedValue(err);
    const { result } = renderHook(() => useRoomStatusMutations());

    await act(async () => {
      await expect(
        result.current.removeRoomStatus("101")
      ).rejects.toThrow("fail");
    });
    expect(result.current.error).toBe(err);
  });
});
