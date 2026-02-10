import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import usePrimeRequestsData from "../usePrimeRequestsData";

/* eslint-disable no-var */
var mockedSubscription: jest.Mock;
/* eslint-enable no-var */

jest.mock("../useFirebaseSubscription", () => {
  mockedSubscription = jest.fn();
  return {
    __esModule: true,
    default: mockedSubscription,
  };
});

describe("usePrimeRequestsData", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sorts requests by submittedAt descending and groups by status", () => {
    mockedSubscription.mockReturnValue({
      data: {
        req_a: {
          requestId: "req_a",
          type: "extension",
          status: "pending",
          bookingId: "BOOK1",
          guestUuid: "occ_1",
          guestName: "A",
          submittedAt: 10,
          updatedAt: 10,
        },
        req_b: {
          requestId: "req_b",
          type: "bag_drop",
          status: "completed",
          bookingId: "BOOK2",
          guestUuid: "occ_2",
          guestName: "B",
          submittedAt: 30,
          updatedAt: 30,
        },
      },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => usePrimeRequestsData());

    expect(result.current.requests.map((r) => r.requestId)).toEqual([
      "req_b",
      "req_a",
    ]);
    expect(result.current.byStatus.pending).toHaveLength(1);
    expect(result.current.byStatus.completed).toHaveLength(1);
  });
});
