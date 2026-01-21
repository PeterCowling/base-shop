import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import useGuestDetailsMutation from "../useGuestDetailsMutation";

let database: unknown;
let refMock: jest.Mock;
let updateMock: jest.Mock;

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
  updateMock = jest.fn();
});

describe("useGuestDetailsMutation", () => {
  it("writes guest details to correct path", async () => {
    updateMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGuestDetailsMutation());

    await result.current.saveGuestDetails("BR1", "occ1", { firstName: "John" });

    expect(updateMock).toHaveBeenCalledWith("guestsDetails/BR1/occ1", {
      firstName: "John",
    });
  });

  it("propagates update errors", async () => {
    const err = new Error("fail");
    updateMock.mockRejectedValue(err);
    const { result } = renderHook(() => useGuestDetailsMutation());

    await expect(
      result.current.saveGuestDetails("BR1", "occ1", {})
    ).rejects.toThrow("fail");
  });
});
