import { act, renderHook } from "@testing-library/react";

import useActivitiesMutations from "../useActivitiesMutations";

const sendEmailGuestMock = jest.fn();
const useAuthMock = jest.fn();
const useFirebaseDatabaseMock = jest.fn();

const getMock = jest.fn();
const refMock = jest.fn();
const updateMock = jest.fn();

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

    errorSpy.mockRestore();
  });
});
