import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import {
  EMAIL_TEST_ADDRESS,
  FIREBASE_BASE_URL,
  OCCUPANT_LINK_PREFIX,
} from "../../utils/emailConstants";
import useBookingEmail, { fetchGuestEmails } from "../useBookingEmail";

// Helper to create a mock fetch Response
function jsonResponse<T>(data: T) {
  return { json: async () => data } as Response;
}

function jsonOkResponse<T>(data: T) {
  return { ok: true, json: async () => data } as Response;
}

describe("useBookingEmail", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_BOOKING_EMAIL_TEST_MODE;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("TASK-10 TC-01/TC-03: sendBookingEmail always uses MCP route with unchanged payload shape", async () => {
    const fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
    // 1st call: booking guest IDs
    fetchMock.mockResolvedValueOnce(jsonResponse({ guestA: {}, guestB: {} }));
    // 2nd call: guest emails
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        guestA: { email: "a@example.com" },
        guestB: { email: "b@example.com" },
      })
    );
    // 3rd call: create email draft via MCP
    fetchMock.mockResolvedValueOnce(jsonOkResponse({ success: true, draftId: "draft-1" }));

    const { result } = renderHook(() => useBookingEmail());

    let sendResult:
      | Awaited<ReturnType<typeof result.current.sendBookingEmail>>
      | undefined;
    await act(async () => {
      sendResult = await result.current.sendBookingEmail("BOOK123", {
        guestA: "override@example.com",
      });
    });

    const recipients = ["override@example.com", "b@example.com"];
    const links = ["guestA", "guestB"].map(
      (id) => `${OCCUPANT_LINK_PREFIX}${id}`
    );
    expect(sendResult).toMatchObject({
      success: true,
      bookingRef: "BOOK123",
      occupantIds: ["guestA", "guestB"],
      recipients,
      occupantLinks: links,
      draftId: "draft-1",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/mcp/booking-email",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRef: "BOOK123",
          recipients,
          occupantLinks: links,
        }),
      })
    );
  });

  it("ignores __notes when deriving occupant IDs for links and activity payloads", async () => {
    const fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        __notes: { n1: { text: "hello", timestamp: "t", user: "u" } },
        guestA: { checkInDate: "2024-01-01" },
      })
    );
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        guestA: { email: "a@example.com" },
      })
    );
    fetchMock.mockResolvedValueOnce(jsonOkResponse({ success: true, draftId: "draft-1" }));

    const { result } = renderHook(() => useBookingEmail());

    await act(async () => {
      await result.current.sendBookingEmail("BOOK123");
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/mcp/booking-email",
      expect.objectContaining({
        body: JSON.stringify({
          bookingRef: "BOOK123",
          recipients: ["a@example.com"],
          occupantLinks: [`${OCCUPANT_LINK_PREFIX}guestA`],
        }),
      }),
    );
  });

  it("TASK-10 TC-02: MCP errors are surfaced without fallback", async () => {
    const fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(jsonResponse({ guestA: {}, guestB: {} }));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        guestA: { email: "a@example.com" },
        guestB: { email: "b@example.com" },
      })
    );
    fetchMock.mockResolvedValueOnce(
      { ok: false, json: async () => ({ error: "MCP unavailable" }) } as Response
    );

    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { result } = renderHook(() => useBookingEmail());

    let sendResult:
      | Awaited<ReturnType<typeof result.current.sendBookingEmail>>
      | undefined;
    await act(async () => {
      sendResult = await result.current.sendBookingEmail("BOOK123", {
        guestA: "override@example.com",
      });
    });

    expect(sendResult).toMatchObject({
      success: false,
      bookingRef: "BOOK123",
      error: "MCP unavailable",
      occupantIds: [],
      recipients: [],
      occupantLinks: [],
    });
    expect(result.current.message).toContain("MCP unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/mcp/booking-email",
      expect.any(Object)
    );
    const calledUrls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(
      calledUrls.some((url) => url.includes("script.google.com/macros"))
    ).toBe(false);

    errorSpy.mockRestore();
  });

  it("fetchGuestEmails returns id to email map", async () => {
    const fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        g1: { email: "one@example.com" },
        g2: { email: "two@example.com" },
      })
    );

    const result = await fetchGuestEmails("BR");

    expect(fetchMock).toHaveBeenCalledWith(
      `${FIREBASE_BASE_URL}/guestsDetails/BR.json`
    );
    expect(result).toEqual({ g1: "one@example.com", g2: "two@example.com" });
  });

  it("fetchGuestEmails throws for malformed data", async () => {
    const fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(jsonResponse({ bad: { mail: "x" } }));

    await expect(fetchGuestEmails("BR")).rejects.toThrow(
      "Invalid guest email data"
    );
  });

  it("sendBookingEmail surfaces validation errors", async () => {
    const fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(jsonResponse("not-object"));

    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { result } = renderHook(() => useBookingEmail());

    await act(async () => {
      await result.current.sendBookingEmail("BOOKBAD");
    });

    expect(result.current.message).toMatch(/Invalid booking response/);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it("TASK-10 TC-04: test mode override still routes through MCP with test recipient", async () => {
    process.env.NEXT_PUBLIC_BOOKING_EMAIL_TEST_MODE = "true";

    const fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(jsonResponse({ guestA: {}, guestB: {} }));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        guestA: { email: "a@example.com" },
        guestB: { email: "b@example.com" },
      })
    );
    fetchMock.mockResolvedValueOnce(jsonOkResponse({ success: true, draftId: "draft-1" }));

    const { result } = renderHook(() => useBookingEmail());

    await act(async () => {
      await result.current.sendBookingEmail("BOOK123", {
        guestA: "override@example.com",
      });
    });

    const occupantLinks = ["guestA", "guestB"].map(
      (id) => `${OCCUPANT_LINK_PREFIX}${id}`
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/mcp/booking-email",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRef: "BOOK123",
          recipients: [EMAIL_TEST_ADDRESS],
          occupantLinks,
        }),
      })
    );
  });
});
