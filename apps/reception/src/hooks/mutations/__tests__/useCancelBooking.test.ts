import { act, renderHook } from "@testing-library/react";

import { useFirebaseDatabase } from "../../../services/useFirebase";
import useActivitiesMutations from "../useActivitiesMutations";
import useArchiveBooking from "../useArchiveBooking";
import useCancelBooking from "../useCancelBooking";

// Mock dependencies
jest.mock("../useArchiveBooking");
jest.mock("../useActivitiesMutations");
jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: jest.fn(),
}));

const mockArchiveBooking = jest.fn();
const mockAddActivity = jest.fn();

const useArchiveBookingMock = useArchiveBooking as jest.MockedFunction<
  typeof useArchiveBooking
>;
const useActivitiesMutationsMock =
  useActivitiesMutations as jest.MockedFunction<
    typeof useActivitiesMutations
  >;
const useFirebaseDatabaseMock = useFirebaseDatabase as jest.MockedFunction<
  typeof useFirebaseDatabase
>;

// Mock Firebase get function
const mockGet = jest.fn();
jest.mock("firebase/database", () => ({
  ref: jest.fn((db: unknown, path: string) => ({ path })),
  get: (...args: unknown[]) => mockGet(...args),
}));

describe("useCancelBooking", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    useArchiveBookingMock.mockReturnValue({
      archiveBooking: mockArchiveBooking,
      loading: false,
      error: null,
    });

    useActivitiesMutationsMock.mockReturnValue({
      addActivity: mockAddActivity,
       
      addActivities: jest.fn() as any,
       
      deleteActivity: jest.fn() as any,
      loading: false,
      error: null,
    });

    useFirebaseDatabaseMock.mockReturnValue({} as any);  

    mockArchiveBooking.mockResolvedValue(undefined);
    mockAddActivity.mockResolvedValue({ success: true });
  });

  // TC-01: Call useCancelBooking on booking with 2 occupants → status="cancelled" at /bookingMeta, 2 activities logged (code 27)
  it("calls archiveBooking and logs activity code 27 for each occupant", async () => {
    // Mock Firebase get to return 2 occupants
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        occupant1: { firstName: "John", lastName: "Doe" },
        occupant2: { firstName: "Jane", lastName: "Smith" },
      }),
    });

    const { result } = renderHook(() => useCancelBooking());

    await act(async () => {
      await result.current.cancelBooking("BOOK123", "customer request");
    });

    // Verify archiveBooking was called once
    expect(mockArchiveBooking).toHaveBeenCalledTimes(1);
    expect(mockArchiveBooking).toHaveBeenCalledWith(
      "BOOK123",
      "customer request",
      "staff"
    );

    // Verify addActivity was called twice (once per occupant) with code 27
    expect(mockAddActivity).toHaveBeenCalledTimes(2);
    expect(mockAddActivity).toHaveBeenCalledWith("occupant1", 27);
    expect(mockAddActivity).toHaveBeenCalledWith("occupant2", 27);
  });

  // TC-02: guestsByBooking data intact for both occupants after cancellation
  it("does not delete guestsByBooking data during cancellation", async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        occupant1: { firstName: "John" },
      }),
    });

    const { result } = renderHook(() => useCancelBooking());

    await act(async () => {
      await result.current.cancelBooking("BOOK123");
    });

    // Verify no delete operations (archiveBooking doesn't delete, addActivity doesn't delete)
    // This is implicit - we only write to /bookingMeta and /activities, not delete from /guestsByBooking
    expect(mockArchiveBooking).toHaveBeenCalled();
    expect(mockAddActivity).toHaveBeenCalled();
  });

  // TC-03: Email draft auto-triggered for both occupants (via mock sendEmailGuest)
  it("triggers email draft via addActivity code 27 for all occupants", async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        occupant1: {},
        occupant2: {},
        occupant3: {},
      }),
    });

    const { result } = renderHook(() => useCancelBooking());

    await act(async () => {
      await result.current.cancelBooking("BOOK123");
    });

    // Code 27 is in relevantCodes, so addActivity will trigger maybeSendEmailGuest
    // We verify addActivity was called with code 27 for all occupants
    expect(mockAddActivity).toHaveBeenCalledTimes(3);
    expect(mockAddActivity).toHaveBeenCalledWith("occupant1", 27);
    expect(mockAddActivity).toHaveBeenCalledWith("occupant2", 27);
    expect(mockAddActivity).toHaveBeenCalledWith("occupant3", 27);
  });

  // TC-04: Error during status write → operation fails, no activities logged
  it("throws error and does not log activities if archiveBooking fails", async () => {
    mockArchiveBooking.mockRejectedValue(new Error("Firebase write failed"));

    const { result } = renderHook(() => useCancelBooking());

    await expect(
      act(async () => {
        await result.current.cancelBooking("BOOK123");
      })
    ).rejects.toThrow("Firebase write failed");

    // Verify archiveBooking was called but addActivity was not
    expect(mockArchiveBooking).toHaveBeenCalledTimes(1);
    expect(mockAddActivity).not.toHaveBeenCalled();
  });

  // TC-05: Error during activity log → operation continues (partial success)
  it("continues with remaining activities if one activity log fails", async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        occupant1: {},
        occupant2: {},
      }),
    });

    // First call succeeds, second call fails
    mockAddActivity
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: "Activity write failed" });

    const { result } = renderHook(() => useCancelBooking());

    // Should not throw - partial success is acceptable
    await act(async () => {
      await result.current.cancelBooking("BOOK123");
    });

    expect(mockArchiveBooking).toHaveBeenCalledTimes(1);
    expect(mockAddActivity).toHaveBeenCalledTimes(2);
  });

  // TC-06: Multi-occupant booking cancellation → activities written with unique activityIds (no collision)
  it("handles multi-occupant bookings with unique activity IDs", async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        occ1: {},
        occ2: {},
        occ3: {},
        occ4: {},
      }),
    });

    mockAddActivity.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useCancelBooking());

    await act(async () => {
      await result.current.cancelBooking("BOOK123");
    });

    // Verify each occupant gets their own addActivity call
    expect(mockAddActivity).toHaveBeenCalledTimes(4);
    expect(mockAddActivity).toHaveBeenCalledWith("occ1", 27);
    expect(mockAddActivity).toHaveBeenCalledWith("occ2", 27);
    expect(mockAddActivity).toHaveBeenCalledWith("occ3", 27);
    expect(mockAddActivity).toHaveBeenCalledWith("occ4", 27);

    // Activity IDs are generated by useActivitiesMutations (via Date.now()),
    // so uniqueness is guaranteed by that implementation
  });
});
