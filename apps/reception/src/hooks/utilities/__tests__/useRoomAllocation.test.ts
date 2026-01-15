/* eslint-env vitest */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CheckInRow } from "../../../types/component/CheckinRow";
import type { ConfirmAllocateOptions } from "../../../utils/confirmAndAllocateRoom";
import useRoomAllocation from "../useRoomAllocation";

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var confirmMock: ReturnType<typeof vi.fn>;
var allocateRoomMock: ReturnType<typeof vi.fn>;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                      */
/* ------------------------------------------------------------------ */
vi.mock("../../mutations/useAllocateRoom", () => {
  allocateRoomMock = vi.fn();
  return {
    default: () => ({ allocateRoomIfAllowed: allocateRoomMock }),
  };
});

vi.mock("../../../utils/confirmAndAllocateRoom", () => {
  confirmMock = vi.fn();
  return { confirmAndAllocateRoom: (opts: unknown) => confirmMock(opts) };
});

const booking: CheckInRow = {
  bookingRef: "BR1",
  occupantId: "O1",
  checkInDate: "2025-01-01",
  rooms: [],
  roomAllocated: "101",
  isFirstForBooking: true,
};

const setup = () =>
  renderHook(() =>
    useRoomAllocation({
      booking,
      selectedDate: "2025-01-01",
      allGuests: [booking],
    })
  );

beforeEach(() => {
  vi.clearAllMocks();
  allocateRoomMock.mockResolvedValue("105");
  confirmMock.mockImplementation(async (opts: ConfirmAllocateOptions) => {
    const val = await opts.onConfirm();
    opts.onSuccess?.(val);
  });
});

describe("useRoomAllocation", () => {
  it("allocates room on blur", async () => {
    const { result } = setup();

    act(() => {
      result.current.setDraftValue("105");
    });

    await act(async () => {
      result.current.handleBlur();
      await Promise.resolve();
    });

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        occupantId: "O1",
        oldRoomValue: "101",
        newRoomValue: "105",
        occupantCount: 1,
      })
    );

    expect(allocateRoomMock).toHaveBeenCalled();

    expect(result.current.draftValue).toBe("105");
  });

  it("allocates room on Enter key", async () => {
    const { result } = setup();
    allocateRoomMock.mockResolvedValueOnce("106");
    act(() => {
      result.current.setDraftValue("106");
    });

    await act(async () => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>);
      await Promise.resolve();
    });

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ newRoomValue: "106" })
    );
    expect(result.current.draftValue).toBe("106");
  });
});
