import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ToastMessageType } from "../../../utils/toastUtils";

interface MockUser {
  user_name: string;
}

let mockUser: MockUser | null = { user_name: "pete" };

const saveGuestByRoomMock = vi.fn();
const saveRoomsByDateMock = vi.fn();
const logActivityMock = vi.fn();
const toastMock = vi.fn();

vi.mock("../useGuestByRoomMutations", () => ({
  default: () => ({ saveGuestByRoom: saveGuestByRoomMock }),
}));
vi.mock("../useRoomsByDateMutations", () => ({
  default: () => ({ saveRoomsByDate: saveRoomsByDateMock }),
}));
vi.mock("../useActivitiesMutations", () => ({
  default: () => ({ logActivity: logActivityMock }),
}));
vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));
vi.mock("../../../utils/toastUtils", () => ({
  showToast: (message: string, type: ToastMessageType) =>
    toastMock(message, type),
}));

import useAllocateRoom, { isUpgrade } from "../useAllocateRoom";

const baseParams = {
  occupantId: "occ1",
  newRoomValue: "index_4",
  oldDate: "2024-01-01",
  oldRoom: "index_3",
  oldBookingRef: "BR",
  oldGuestId: "occ1",
  newDate: "2024-01-02",
  newRoom: "index_4",
  newBookingRef: "BR",
  newGuestId: "occ1",
};

describe("isUpgrade", () => {
  it("detects upgrade cases correctly", () => {
    expect(isUpgrade("index_3", "index_9")).toBe(true);
    expect(isUpgrade("index_5", "index_11")).toBe(true);
    expect(isUpgrade("index_10", "index_7")).toBe(true);
  });

  it("handles non-upgrade and null values", () => {
    expect(isUpgrade("index_7", "index_8")).toBe(false);
    expect(isUpgrade(null, "index_5")).toBe(false);
  });
});

describe("useAllocateRoom", () => {
  beforeEach(() => {
    saveGuestByRoomMock.mockReset();
    saveRoomsByDateMock.mockReset();
    logActivityMock.mockReset();
    toastMock.mockReset();
    mockUser = { user_name: "pete" };
  });

  it("allocates room when user has permission", async () => {
    saveGuestByRoomMock.mockResolvedValue({ allocated: "index_4" });

    const { result } = renderHook(() => useAllocateRoom());
    let value = "";
    await act(async () => {
      value = await result.current.allocateRoomIfAllowed(baseParams);
    });

    expect(value).toBe("index_4");
    expect(saveGuestByRoomMock).toHaveBeenCalledWith("occ1", {
      allocated: "index_4",
    });
    expect(saveRoomsByDateMock).toHaveBeenCalled();
    expect(logActivityMock).toHaveBeenCalledWith("occ1", 18);
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("returns empty string and shows toast when user lacks permission", async () => {
    mockUser = { user_name: "bob" };
    const { result } = renderHook(() => useAllocateRoom());

    let ret = "foo";
    await act(async () => {
      ret = await result.current.allocateRoomIfAllowed(baseParams);
    });

    expect(ret).toBe("");
    expect(toastMock).toHaveBeenCalledWith(
      "You do not have permission to update this occupant's room.",
      "info"
    );
    expect(saveGuestByRoomMock).not.toHaveBeenCalled();
    expect(saveRoomsByDateMock).not.toHaveBeenCalled();
    expect(logActivityMock).not.toHaveBeenCalled();
  });

  it("handles errors from mutations", async () => {
    const err = new Error("fail");
    saveGuestByRoomMock.mockRejectedValue(err);
    const { result } = renderHook(() => useAllocateRoom());

    await act(async () => {
      await expect(
        result.current.allocateRoomIfAllowed(baseParams)
      ).rejects.toThrow("fail");
    });
    expect(toastMock).toHaveBeenCalledWith(
      "Error updating occupant: Error: fail",
      "error"
    );
    await waitFor(() => expect(result.current.error).toBe(err));
  });
});
