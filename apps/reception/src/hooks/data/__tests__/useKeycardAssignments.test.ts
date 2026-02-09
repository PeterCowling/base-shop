import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import type { KeycardAssignment } from "../../../types/hooks/data/keycardAssignmentData";
import useFirebaseSubscription from "../useFirebaseSubscription";
import { useKeycardAssignments } from "../useKeycardAssignments";

jest.mock("../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

const issued: KeycardAssignment = {
  keycardNumber: "042",
  isMasterKey: false,
  occupantId: "O1",
  bookingRef: "BR1",
  roomNumber: "5",
  depositMethod: "CASH",
  depositAmount: 10,
  assignedAt: "2026-01-23T10:00:00Z",
  assignedBy: "staff-uid",
  status: "issued",
};

const returned: KeycardAssignment = {
  keycardNumber: "043",
  isMasterKey: false,
  occupantId: "O2",
  bookingRef: "BR2",
  roomNumber: "7",
  assignedAt: "2026-01-23T11:00:00Z",
  assignedBy: "staff-uid",
  returnedAt: "2026-01-23T18:00:00Z",
  returnedBy: "staff-uid",
  status: "returned",
};

const masterKey: KeycardAssignment = {
  keycardNumber: "M01",
  isMasterKey: true,
  assignedToStaff: "manager-uid",
  assignedAt: "2026-01-01T08:00:00Z",
  assignedBy: "owner-uid",
  status: "issued",
};

describe("useKeycardAssignments", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty arrays when no data", () => {
    mockedSub.mockReturnValue({ data: null, loading: false, error: null });

    const { result } = renderHook(() => useKeycardAssignments());

    expect(result.current.assignments).toEqual([]);
    expect(result.current.activeAssignments).toEqual([]);
    expect(result.current.assignmentsRecord).toEqual({});
    expect(result.current.loading).toBe(false);
  });

  it("separates active (issued) from inactive assignments", () => {
    mockedSub.mockReturnValue({
      data: { a1: issued, a2: returned, a3: masterKey } as Record<string, unknown>,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useKeycardAssignments());

    expect(result.current.assignments).toHaveLength(3);
    expect(result.current.activeAssignments).toHaveLength(2);
    expect(result.current.activeAssignments.map((a) => a.keycardNumber)).toEqual(
      expect.arrayContaining(["042", "M01"])
    );
  });

  it("returns loading state", () => {
    mockedSub.mockReturnValue({ data: null, loading: true, error: null });

    const { result } = renderHook(() => useKeycardAssignments());

    expect(result.current.loading).toBe(true);
    expect(result.current.assignments).toEqual([]);
  });

  it("provides assignmentsRecord for lookup by ID", () => {
    mockedSub.mockReturnValue({
      data: { a1: issued } as Record<string, unknown>,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useKeycardAssignments());

    expect(result.current.assignmentsRecord).toHaveProperty("a1");
    expect(result.current.assignmentsRecord.a1.keycardNumber).toBe("042");
  });
});
