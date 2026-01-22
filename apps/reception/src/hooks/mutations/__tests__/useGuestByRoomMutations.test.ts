import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import type { GuestByRoomRecord } from "../../../types/hooks/data/guestByRoomData";
import useGuestByRoomMutations from "../useGuestByRoomMutations";

// Mocks
let database: unknown;
let refMock: jest.Mock;
let updateMock: jest.Mock;
let getMock: jest.Mock;

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
  get: (...args: unknown[]) => getMock(...args),
}));

function snap<T>(val: T) {
  return {
    exists: () => val !== null && val !== undefined,
    val: () => val,
  };
}

beforeEach(() => {
  database = {};
  refMock = jest.fn((_db: unknown, path?: string) => path ?? "");
  updateMock = jest.fn();
  getMock = jest.fn();
});

describe("useGuestByRoomMutations", () => {
  it("updates and returns guest-room record", async () => {
    const record: Partial<GuestByRoomRecord> = { allocated: "101" };
    updateMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue(snap(record));

    const { result } = renderHook(() => useGuestByRoomMutations());
    let data: unknown;
    await act(async () => {
      data = await result.current.saveGuestByRoom("occ1", record);
    });

    expect(updateMock).toHaveBeenCalledWith("guestByRoom/occ1", record);
    expect(getMock).toHaveBeenCalledWith("guestByRoom/occ1");
    expect(data).toEqual(record);
    expect(result.current.error).toBeNull();
  });

  it("sets error when record missing after update", async () => {
    updateMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue(snap(null));

    const { result } = renderHook(() => useGuestByRoomMutations());
    await act(async () => {
      await expect(
        result.current.saveGuestByRoom("occ1", {})
      ).rejects.toThrow("Occupant record not found after update.");
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
