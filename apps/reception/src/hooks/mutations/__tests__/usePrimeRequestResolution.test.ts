import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import type { PrimeRequestRecord } from "../../../types/hooks/data/primeRequestsData";
import usePrimeRequestResolution from "../usePrimeRequestResolution";

/* eslint-disable no-var */
var refMock: jest.Mock;
var getMock: jest.Mock;
var updateMock: jest.Mock;
var updateBookingDatesMock: jest.Mock;
var savePreorderMock: jest.Mock;
var getDataByPath: Record<string, unknown>;
/* eslint-enable no-var */

jest.mock("firebase/database", () => {
  refMock = jest.fn((_database: unknown, path?: string) => path ?? "__root__");
  getMock = jest.fn(async (path: string) => ({
    exists: () => Object.prototype.hasOwnProperty.call(getDataByPath, path),
    val: () => getDataByPath[path],
  }));
  updateMock = jest.fn().mockResolvedValue(undefined);

  return {
    ref: (...args: unknown[]) => refMock(...args),
    get: (...args: unknown[]) => getMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
  };
});

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      uid: "staff-123",
      email: "staff@example.com",
      user_name: "Staff One",
      displayName: "Staff One",
    },
  }),
}));

jest.mock("../useChangeBookingDatesMutator", () => {
  updateBookingDatesMock = jest.fn().mockResolvedValue(undefined);
  return {
    useBookingDatesMutator: () => ({
      updateBookingDates: updateBookingDatesMock,
    }),
  };
});

jest.mock("../usePreorderMutations", () => {
  savePreorderMock = jest.fn().mockResolvedValue(undefined);
  return {
    __esModule: true,
    default: () => ({ savePreorder: savePreorderMock }),
  };
});

function buildRequest(
  overrides: Partial<PrimeRequestRecord> = {},
): PrimeRequestRecord {
  return {
    requestId: "req_1",
    type: "extension",
    status: "pending",
    bookingId: "BOOK1",
    guestUuid: "occ_1",
    guestName: "Guest One",
    submittedAt: 10,
    updatedAt: 10,
    ...overrides,
  };
}

describe("usePrimeRequestResolution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDataByPath = {};
  });

  it("TC-02: approving extension request updates booking dates and status metadata", async () => {
    const request = buildRequest({
      requestId: "extension_1",
      type: "extension",
      payload: {
        requestedCheckOutDate: "2026-03-10",
      },
    });

    getDataByPath["primeRequests/byId/extension_1"] = request;
    getDataByPath["bookings/BOOK1/occ_1"] = {
      checkInDate: "2026-03-01",
      checkOutDate: "2026-03-05",
    };

    const { result } = renderHook(() => usePrimeRequestResolution());

    await act(async () => {
      await result.current.resolveRequest({
        request,
        nextStatus: "approved",
        resolutionNote: "Extended after desk verification",
      });
    });

    expect(updateBookingDatesMock).toHaveBeenCalledWith({
      bookingRef: "BOOK1",
      occupantId: "occ_1",
      oldCheckIn: "2026-03-01",
      oldCheckOut: "2026-03-05",
      newCheckIn: "2026-03-01",
      newCheckOut: "2026-03-10",
      extendedPrice: "0",
    });

    expect(updateMock).toHaveBeenCalledWith(
      "__root__",
      expect.objectContaining({
        "primeRequests/byStatus/pending/extension_1": null,
        "primeRequests/byStatus/approved/extension_1": true,
      }),
    );
  });

  it("TC-03: completing bag-drop request syncs bagStorage and request status", async () => {
    const request = buildRequest({
      requestId: "bag_drop_1",
      type: "bag_drop",
      payload: {
        pickupWindow: "16:00 - 18:00",
      },
    });

    getDataByPath["primeRequests/byId/bag_drop_1"] = request;

    const { result } = renderHook(() => usePrimeRequestResolution());

    await act(async () => {
      await result.current.resolveRequest({
        request,
        nextStatus: "completed",
      });
    });

    expect(updateMock).toHaveBeenCalledWith(
      "bagStorage/occ_1",
      expect.objectContaining({
        requestStatus: "completed",
        requestId: "bag_drop_1",
      }),
    );

    expect(updateMock).toHaveBeenCalledWith(
      "__root__",
      expect.objectContaining({
        "primeRequests/byStatus/pending/bag_drop_1": null,
        "primeRequests/byStatus/completed/bag_drop_1": true,
      }),
    );
  });

  it("TC-04: approving meal-change exception updates preorder through mutation seam", async () => {
    const request = buildRequest({
      requestId: "meal_change_1",
      type: "meal_change_exception",
      payload: {
        service: "breakfast",
        serviceDate: "2026-03-03",
        requestedValue: "PREPAID MP A",
        currentNightKey: "night1",
      },
    });

    getDataByPath["primeRequests/byId/meal_change_1"] = request;
    getDataByPath["preorder/occ_1"] = {
      night1: {
        night: "night1",
        breakfast: "NA",
        drink1: "NA",
        drink2: "NA",
        serviceDate: "2026-03-03",
      },
    };

    const { result } = renderHook(() => usePrimeRequestResolution());

    await act(async () => {
      await result.current.resolveRequest({
        request,
        nextStatus: "approved",
      });
    });

    expect(savePreorderMock).toHaveBeenCalledWith(
      "occ_1",
      "night1",
      expect.objectContaining({
        breakfast: "PREPAID MP A",
        drink1: "NA",
        drink2: "NA",
      }),
    );

    expect(updateMock).toHaveBeenCalledWith(
      "__root__",
      expect.objectContaining({
        "primeRequests/byStatus/pending/meal_change_1": null,
        "primeRequests/byStatus/approved/meal_change_1": true,
      }),
    );
  });
});
