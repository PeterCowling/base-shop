import { act, renderHook } from "@testing-library/react";

import { FIREBASE_BASE_URL } from "../../utils/emailConstants";
import useEmailGuest from "../useEmailGuest";

describe("useEmailGuest", () => {
  const originalFetch = global.fetch;
  /* eslint-disable no-var */
  var fetchMock: jest.Mock;
  /* eslint-enable no-var */

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as Record<string, unknown>).fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("posts activity payload to MCP route and returns drafted status", async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ guestA: { email: "a@example.com" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            status: "drafted",
            draftId: "draft-1",
          }),
      } as Response);

    const { result } = renderHook(() => useEmailGuest());

    let sendResult;
    await act(async () => {
      sendResult = await result.current.sendEmailGuest({
        bookingRef: "REF123",
        activityCode: 21,
      });
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${FIREBASE_BASE_URL}/guestsDetails/REF123.json`
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/mcp/guest-email-activity",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRef: "REF123",
          activityCode: 21,
          recipients: ["a@example.com"],
        }),
      })
    );
    expect(sendResult).toMatchObject({
      success: true,
      status: "drafted",
      bookingRef: "REF123",
      activityCode: 21,
      recipients: ["a@example.com"],
      draftId: "draft-1",
    });
    expect(result.current.message).toBe("draft-1");
    expect(result.current.loading).toBe(false);
  });

  it("defers when no recipient emails are available", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ guestA: { email: "" } }),
    } as Response);

    const { result } = renderHook(() => useEmailGuest());

    let sendResult;
    await act(async () => {
      sendResult = await result.current.sendEmailGuest({
        bookingRef: "REF123",
        activityCode: 21,
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sendResult).toMatchObject({
      success: true,
      status: "deferred",
      reason: "no-recipient-email",
    });
    expect(result.current.message).toContain("Guest email deferred");
  });

  it("includes inferred provider for first prepayment-chase activity", async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ guestA: { email: "a@example.com" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, status: "drafted" }),
      } as Response);

    const { result } = renderHook(() => useEmailGuest());

    await act(async () => {
      await result.current.sendEmailGuest({
        bookingRef: "7763-123456789",
        activityCode: 5,
      });
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/mcp/guest-email-activity",
      expect.objectContaining({
        body: JSON.stringify({
          bookingRef: "7763-123456789",
          activityCode: 5,
          recipients: ["a@example.com"],
          prepaymentProvider: "hostelworld",
        }),
      })
    );
  });

  it("forwards dryRun to MCP route and returns preview payload", async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ guestA: { email: "a@example.com" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            status: "drafted",
            dryRun: true,
            reason: "dry-run-no-draft-created",
            preview: {
              subject: "Test subject",
              bodyPlain: "Test body",
            },
          }),
      } as Response);

    const { result } = renderHook(() => useEmailGuest());

    let sendResult;
    await act(async () => {
      sendResult = await result.current.sendEmailGuest({
        bookingRef: "REF123",
        activityCode: 21,
        dryRun: true,
      });
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/mcp/guest-email-activity",
      expect.objectContaining({
        body: JSON.stringify({
          bookingRef: "REF123",
          activityCode: 21,
          recipients: ["a@example.com"],
          dryRun: true,
        }),
      })
    );

    expect(sendResult).toMatchObject({
      success: true,
      status: "drafted",
      dryRun: true,
      reason: "dry-run-no-draft-created",
      preview: {
        subject: "Test subject",
        bodyPlain: "Test body",
      },
    });
  });

  it("returns error status when route responds with failure", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    fetchMock
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ guestA: { email: "a@example.com" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "MCP unavailable" }),
      } as Response);

    const { result } = renderHook(() => useEmailGuest());

    let sendResult;
    await act(async () => {
      sendResult = await result.current.sendEmailGuest({
        bookingRef: "REF123",
        activityCode: 21,
      });
    });

    expect(sendResult).toMatchObject({
      success: false,
      status: "error",
      error: "MCP unavailable",
    });
    expect(result.current.message).toBe("MCP unavailable");

    errorSpy.mockRestore();
  });
});
