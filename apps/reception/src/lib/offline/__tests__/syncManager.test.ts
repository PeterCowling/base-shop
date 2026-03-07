import type { Database } from "firebase/database";

import type { PendingWrite } from "../receptionDb";
import {
  GUEST_EMAIL_DRAFT_OPERATION,
  queueGuestEmailDraftRetry,
  syncPendingWrites,
} from "../syncManager";

const addPendingWriteMock = jest.fn();
const getPendingWritesMock = jest.fn();
const removePendingWriteMock = jest.fn();
const sendGuestEmailDraftRequestMock = jest.fn();

jest.mock("../receptionDb", () => ({
  addPendingWrite: (...args: unknown[]) => addPendingWriteMock(...args),
  getPendingWrites: (...args: unknown[]) => getPendingWritesMock(...args),
  removePendingWrite: (...args: unknown[]) => removePendingWriteMock(...args),
}));

jest.mock("../../../services/useEmailGuest", () => ({
  sendGuestEmailDraftRequest: (...args: unknown[]) =>
    sendGuestEmailDraftRequestMock(...args),
}));

describe("syncManager guest email retries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    removePendingWriteMock.mockResolvedValue(true);
    addPendingWriteMock.mockResolvedValue(1);
  });

  it("deduplicates queued guest email retries by bookingRef + activityCode", async () => {
    const existing: PendingWrite = {
      id: 11,
      path: "",
      operation: GUEST_EMAIL_DRAFT_OPERATION,
      data: { bookingRef: "REF123", activityCode: 21 },
      timestamp: 1,
    };
    getPendingWritesMock.mockResolvedValue([existing]);

    const queuedId = await queueGuestEmailDraftRetry({
      bookingRef: "REF123",
      activityCode: 21,
    });

    expect(queuedId).toBe(0);
    expect(addPendingWriteMock).not.toHaveBeenCalled();
  });

  it("queues guest email retry when no duplicate exists", async () => {
    getPendingWritesMock.mockResolvedValue([]);

    const queuedId = await queueGuestEmailDraftRetry({
      bookingRef: " REF123 ",
      activityCode: 27,
    });

    expect(queuedId).toBe(1);
    expect(addPendingWriteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "",
        operation: GUEST_EMAIL_DRAFT_OPERATION,
        data: { bookingRef: "REF123", activityCode: 27 },
        domain: "guest-email",
      })
    );
  });

  it("syncs queued guest email retries and removes successful entries", async () => {
    const queued: PendingWrite = {
      id: 7,
      path: "",
      operation: GUEST_EMAIL_DRAFT_OPERATION,
      data: { bookingRef: "REF123", activityCode: 21 },
      timestamp: 1,
    };
    getPendingWritesMock.mockResolvedValue([queued]);
    sendGuestEmailDraftRequestMock.mockResolvedValue({
      success: true,
      status: "drafted",
      bookingRef: "REF123",
      activityCode: 21,
      recipients: ["guest@example.com"],
    });

    const result = await syncPendingWrites({} as Database);

    expect(sendGuestEmailDraftRequestMock).toHaveBeenCalledWith({
      bookingRef: "REF123",
      activityCode: 21,
    });
    expect(removePendingWriteMock).toHaveBeenCalledWith(7);
    expect(result).toMatchObject({ success: true, processed: 1, failed: 0 });
  });

  it("keeps queued guest email retries when processing fails", async () => {
    const queued: PendingWrite = {
      id: 9,
      path: "",
      operation: GUEST_EMAIL_DRAFT_OPERATION,
      data: { bookingRef: "REF123", activityCode: 21 },
      timestamp: 1,
    };
    getPendingWritesMock.mockResolvedValue([queued]);
    sendGuestEmailDraftRequestMock.mockResolvedValue({
      success: false,
      status: "error",
      bookingRef: "REF123",
      activityCode: 21,
      recipients: [],
      error: "Missing bearer token",
    });

    const result = await syncPendingWrites({} as Database);

    expect(removePendingWriteMock).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.failed).toBe(1);
  });
});
