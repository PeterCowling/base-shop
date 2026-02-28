import { act, renderHook } from "@testing-library/react";

import useActivitiesMutations from "../useActivitiesMutations";

const sendEmailGuestMock = jest.fn();
const useAuthMock = jest.fn();
const useFirebaseDatabaseMock = jest.fn();

const getMock = jest.fn();
const refMock = jest.fn();
const updateMock = jest.fn();
const useOnlineStatusMock = jest.fn();
const queueOfflineWriteMock = jest.fn();

jest.mock("../../../services/useEmailGuest", () => ({
  __esModule: true,
  default: () => ({ sendEmailGuest: sendEmailGuestMock }),
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => useFirebaseDatabaseMock(),
}));

jest.mock("firebase/database", () => ({
  get: (...args: unknown[]) => getMock(...args),
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

jest.mock("../../../lib/offline/useOnlineStatus", () => ({
  useOnlineStatus: () => useOnlineStatusMock(),
}));

jest.mock("../../../lib/offline/syncManager", () => ({
  queueOfflineWrite: (...args: unknown[]) => queueOfflineWriteMock(...args),
}));

describe("useActivitiesMutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuthMock.mockReturnValue({ user: { user_name: "Pete" } });
    useFirebaseDatabaseMock.mockReturnValue({});

    refMock.mockImplementation((_db: unknown, path?: string) => ({ path: path ?? "" }));
    updateMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue({
      exists: () => true,
      val: () => ({ reservationCode: "REF123" }),
    });

    sendEmailGuestMock.mockResolvedValue({
      success: true,
      status: "drafted",
      bookingRef: "REF123",
      activityCode: 21,
      recipients: ["guest@example.com"],
    });

    useOnlineStatusMock.mockReturnValue(true);
    queueOfflineWriteMock.mockResolvedValue(1);
  });

  it("sends guest email with bookingRef + activityCode for relevant codes", async () => {
    const { result } = renderHook(() => useActivitiesMutations());

    let activityResult;
    await act(async () => {
      activityResult = await result.current.addActivity("occ1", 21);
    });

    expect(activityResult).toMatchObject({ success: true });
    expect(sendEmailGuestMock).toHaveBeenCalledWith({
      bookingRef: "REF123",
      activityCode: 21,
    });
  });

  it("does not call sendEmailGuest for non-relevant codes", async () => {
    const { result } = renderHook(() => useActivitiesMutations());

    await act(async () => {
      await result.current.addActivity("occ1", 9);
    });

    expect(getMock).not.toHaveBeenCalled();
    expect(sendEmailGuestMock).not.toHaveBeenCalled();
  });

  it("logs warning when email drafting is deferred", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    sendEmailGuestMock.mockResolvedValue({
      success: true,
      status: "deferred",
      bookingRef: "REF123",
      activityCode: 21,
      recipients: ["guest@example.com"],
      reason: "unsupported-activity-code",
    });

    const { result } = renderHook(() => useActivitiesMutations());

    await act(async () => {
      await result.current.addActivity("occ1", 21);
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Guest email deferred")
    );

    warnSpy.mockRestore();
  });

  it("logs error when guest email drafting fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    sendEmailGuestMock.mockResolvedValue({
      success: false,
      status: "error",
      bookingRef: "REF123",
      activityCode: 21,
      recipients: [],
      error: "MCP unavailable",
    });

    const { result } = renderHook(() => useActivitiesMutations());

    await act(async () => {
      await result.current.addActivity("occ1", 21);
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Guest email draft failed")
    );
    expect(result.current.error).toBe("Email draft not sent — guest notification failed. Please send manually.");

    errorSpy.mockRestore();
  });

  it("sets error when email is deferred with no-recipient-email reason", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    sendEmailGuestMock.mockResolvedValue({
      success: true,
      status: "deferred",
      bookingRef: "REF123",
      activityCode: 21,
      recipients: [],
      reason: "no-recipient-email",
    });

    const { result } = renderHook(() => useActivitiesMutations());

    await act(async () => {
      await result.current.addActivity("occ1", 21);
    });

    expect(result.current.error).toBe("No guest email on record — email not sent.");

    warnSpy.mockRestore();
  });

  it("does not set error when email is deferred for other reasons", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    sendEmailGuestMock.mockResolvedValue({
      success: true,
      status: "deferred",
      bookingRef: "REF123",
      activityCode: 21,
      recipients: [],
      reason: "unsupported-activity-code",
    });

    const { result } = renderHook(() => useActivitiesMutations());

    await act(async () => {
      await result.current.addActivity("occ1", 21);
    });

    expect(result.current.error).toBeNull();

    warnSpy.mockRestore();
  });

  // TASK-05: Add code 27 to relevantCodes array
  it("sends guest email for activity code 27 (CANCELLED)", async () => {
    const { result } = renderHook(() => useActivitiesMutations());

    let activityResult;
    await act(async () => {
      activityResult = await result.current.addActivity("occ1", 27);
    });

    // TC-01: Code 27 triggers email send (is in relevantCodes)
    expect(activityResult).toMatchObject({ success: true });

    // TC-02: sendEmailGuest called with code 27 and correct bookingRef
    expect(sendEmailGuestMock).toHaveBeenCalledWith({
      bookingRef: "REF123",
      activityCode: 27,
    });
  });

  it("sends guest email for activity code 2 (FIRST_REMINDER)", async () => {
    const { result } = renderHook(() => useActivitiesMutations());

    await act(async () => {
      await result.current.addActivity("occ1", 2);
    });

    expect(sendEmailGuestMock).toHaveBeenCalledWith({
      bookingRef: "REF123",
      activityCode: 2,
    });
  });

  it("sends guest email for activity code 3 (SECOND_REMINDER)", async () => {
    const { result } = renderHook(() => useActivitiesMutations());

    await act(async () => {
      await result.current.addActivity("occ1", 3);
    });

    expect(sendEmailGuestMock).toHaveBeenCalledWith({
      bookingRef: "REF123",
      activityCode: 3,
    });
  });

  it("sends guest email for activity code 4 (AUTO_CANCEL_NO_TNC)", async () => {
    const { result } = renderHook(() => useActivitiesMutations());

    await act(async () => {
      await result.current.addActivity("occ1", 4);
    });

    expect(sendEmailGuestMock).toHaveBeenCalledWith({
      bookingRef: "REF123",
      activityCode: 4,
    });
  });

  describe("offline paths", () => {
    beforeEach(() => {
      useOnlineStatusMock.mockReturnValue(false);
    });

    it("queues addActivity when offline and skips Firebase and email", async () => {
      const { result } = renderHook(() => useActivitiesMutations());

      let activityResult;
      await act(async () => {
        activityResult = await result.current.addActivity("occ1", 21);
      });

      expect(queueOfflineWriteMock).toHaveBeenCalledWith(
        "",
        "update",
        expect.any(Object),
        expect.objectContaining({ atomic: true, domain: "activities" })
      );
      expect(updateMock).not.toHaveBeenCalled();
      expect(sendEmailGuestMock).not.toHaveBeenCalled();
      expect(activityResult).toMatchObject({ success: true, message: "Activity queued for sync" });
    });

    it("returns offline error for removeLastActivity when offline", async () => {
      const { result } = renderHook(() => useActivitiesMutations());

      let activityResult;
      await act(async () => {
        activityResult = await result.current.removeLastActivity("occ1", 21);
      });

      expect(getMock).not.toHaveBeenCalled();
      expect(activityResult).toMatchObject({ success: false });
      expect((activityResult as { error: string }).error).toContain("network connection");
    });
  });
});
