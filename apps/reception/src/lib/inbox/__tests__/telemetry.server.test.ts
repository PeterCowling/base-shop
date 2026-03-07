import { createEvent, listThreadEvents } from "../repositories.server";
import {
  listInboxEvents,
  logInboxEvent,
  logInboxEventBestEffort,
  recordInboxEvent,
} from "../telemetry.server";

jest.mock("../repositories.server", () => ({
  createEvent: jest.fn(),
  listThreadEvents: jest.fn(),
}));

describe("telemetry.server", () => {
  const createEventMock = jest.mocked(createEvent);
  const listThreadEventsMock = jest.mocked(listThreadEvents);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("writes audit-critical events through to the repository", async () => {
    createEventMock.mockResolvedValue({
      id: 1,
      thread_id: "thread-1",
      event_type: "sent",
      actor_uid: "staff-1",
      timestamp: "2026-03-06T10:00:00.000Z",
      metadata_json: null,
    });

    await recordInboxEvent({
      threadId: "thread-1",
      eventType: "sent",
      actorUid: "staff-1",
      metadata: { draftId: "draft-1" },
    });

    expect(createEventMock).toHaveBeenCalledWith({
      threadId: "thread-1",
      eventType: "sent",
      actorUid: "staff-1",
      timestamp: undefined,
      metadata: { draftId: "draft-1" },
    });
  });

  it("rethrows audit-critical write failures", async () => {
    createEventMock.mockRejectedValue(new Error("d1 unavailable"));

    await expect(
      logInboxEvent({
        threadId: "thread-1",
        eventType: "approved",
      }),
    ).rejects.toThrow("d1 unavailable");
  });

  it("swallows best-effort failures and logs them", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    createEventMock.mockRejectedValue(new Error("insert failed"));

    await expect(
      logInboxEventBestEffort({
        threadId: "thread-1",
        eventType: "draft_edited",
      }),
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to log non-critical inbox event",
      expect.objectContaining({
        eventType: "draft_edited",
        threadId: "thread-1",
      }),
    );

    consoleErrorSpy.mockRestore();
  });

  it("truncates oversized metadata before persisting", async () => {
    createEventMock.mockResolvedValue({
      id: 2,
      thread_id: "thread-1",
      event_type: "drafted",
      actor_uid: null,
      timestamp: "2026-03-06T10:00:00.000Z",
      metadata_json: null,
    });

    await logInboxEvent({
      threadId: "thread-1",
      eventType: "drafted",
      metadata: {
        large: "x".repeat(5000),
      },
    });

    expect(createEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          truncated: true,
        }),
      }),
    );
  });

  it("routes guest_matched as best-effort (non-critical)", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    createEventMock.mockRejectedValue(new Error("d1 unavailable"));

    await expect(
      recordInboxEvent({
        threadId: "thread-1",
        eventType: "guest_matched",
        metadata: { bookingRef: "booking-1", senderEmail: "guest@example.com" },
      }),
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to log non-critical inbox event",
      expect.objectContaining({ eventType: "guest_matched" }),
    );
    consoleErrorSpy.mockRestore();
  });

  it("routes guest_match_not_found as best-effort (non-critical)", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    createEventMock.mockRejectedValue(new Error("d1 unavailable"));

    await expect(
      recordInboxEvent({
        threadId: "thread-1",
        eventType: "guest_match_not_found",
        metadata: { senderEmail: "unknown@example.com" },
      }),
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to log non-critical inbox event",
      expect.objectContaining({ eventType: "guest_match_not_found" }),
    );
    consoleErrorSpy.mockRestore();
  });

  it("forwards list filters to the repository query helper", async () => {
    listThreadEventsMock.mockResolvedValue([]);

    await listInboxEvents({
      threadId: "thread-1",
      startTime: "2026-03-01T00:00:00.000Z",
      endTime: "2026-03-06T23:59:59.000Z",
      limit: 25,
    });

    expect(listThreadEventsMock).toHaveBeenCalledWith({
      threadId: "thread-1",
      eventType: undefined,
      startTime: "2026-03-01T00:00:00.000Z",
      endTime: "2026-03-06T23:59:59.000Z",
      limit: 25,
      offset: undefined,
    });
  });
});
