/**
 * Test suite for processCancellationEmail MCP tool (TASK-14)
 *
 * Validates the complete workflow:
 * 1. Parse email via cancellation-email-parser
 * 2. Validate booking exists in Firebase
 * 3. Enumerate occupants from booking
 * 4. Write activity code 22 for each occupant (collision-safe activityIds)
 * 5. Write booking metadata to /bookingMeta
 */

import { parseCancellationEmail } from "../parsers/cancellation-email-parser";
import { processCancellationEmail } from "../tools/process-cancellation-email";

// Mock the parser
jest.mock("../parsers/cancellation-email-parser");

// Mock fetch for Firebase REST API
global.fetch = jest.fn();

describe("processCancellationEmail", () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create mock Response with clone support
  const createMockResponse = (
    data: unknown,
    options: { ok?: boolean; status?: number; statusText?: string } = {}
  ): Response => {
    const response = {
      ok: options.ok ?? true,
      status: options.status ?? 200,
      statusText: options.statusText ?? "OK",
      json: async () => data,
      clone: function () {
        return this;
      },
    } as unknown as Response;
    return response;
  };

  // Helper to extract URL from fetch call (handles Request objects and strings)
  const getUrlFromCall = (call: unknown[]): string => {
    const input = call[0];
    if (typeof input === "string") {
      return input;
    }
    if (input && typeof input === "object" && "url" in input) {
      return (input as Request).url;
    }
    return String(input);
  };

  // Helper to extract body from fetch call
  const getBodyFromCall = (call: unknown[]): string | null => {
    const input = call[0];

    if (input && typeof input === "object") {
      // Check if body is a Buffer
      if ("body" in input && Buffer.isBuffer(input.body)) {
        return (input.body as Buffer).toString("utf-8");
      }

      // Check if body is a string
      if ("body" in input && typeof input.body === "string") {
        return input.body as string;
      }
    }

    // Check second argument (RequestInit)
    const init = call[1] as RequestInit | undefined;
    if (init && init.body) {
      if (Buffer.isBuffer(init.body)) {
        return (init.body as Buffer).toString("utf-8");
      }
      return init.body as string;
    }

    return null;
  };

  // TC-01: Process valid cancellation email → booking status="cancelled", 2 activities logged (code 22)
  test("TC-01: should process valid cancellation email and write status + activities", async () => {
    const emailId = "msg_123";
    const emailHtml = "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30";
    const from = "Octorate <noreply@smtp.octorate.com>";
    const firebaseUrl = "https://test.firebaseio.com";
    const firebaseApiKey = "test-api-key";

    // Mock parser success
    (parseCancellationEmail as jest.Mock).mockReturnValue({
      reservationCode: "6896451364",
      provider: "octorate",
    });

    // Mock Firebase GET /bookings/{reservationCode} → returns booking with 2 occupants
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ occ1: true, occ2: true })
    );

    // Mock Firebase PATCH /activities/{occupantId}/{activityId} (2 calls)
    mockFetch.mockResolvedValueOnce(createMockResponse(null)); // occ1
    mockFetch.mockResolvedValueOnce(createMockResponse(null)); // occ2

    // Mock Firebase PATCH /bookingMeta/{reservationCode}
    mockFetch.mockResolvedValueOnce(createMockResponse(null));

    const result = await processCancellationEmail(
      emailId,
      emailHtml,
      from,
      firebaseUrl,
      firebaseApiKey
    );

    expect(result.status).toBe("success");
    expect(result.reservationCode).toBe("6896451364");
    expect(result.activitiesWritten).toBe(2);

    // Verify parser was called
    expect(parseCancellationEmail).toHaveBeenCalledWith(emailHtml, from);

    // Verify Firebase GET /bookings/{reservationCode}
    const bookingGetCall = mockFetch.mock.calls.find((call) => {
      const url = getUrlFromCall(call as unknown[]);
      return url.includes("/bookings/6896451364.json");
    });
    expect(bookingGetCall).toBeDefined();

    // Verify 2 activity writes (code 22, timestamp, who: "Octorate")
    const activityCalls = (mockFetch.mock.calls as unknown[][]).filter((call) => {
      const url = getUrlFromCall(call);
      return url.includes("/activities/");
    });
    expect(activityCalls).toHaveLength(2);

    // Verify activity shape in first call
    const firstActivityCall = activityCalls[0];
    const firstActivityBodyStr = getBodyFromCall(firstActivityCall);
    expect(firstActivityBodyStr).not.toBeNull();
    const firstActivityBody = JSON.parse(firstActivityBodyStr!);
    expect(firstActivityBody).toMatchObject({
      code: 22,
      who: "Octorate",
    });
    expect(firstActivityBody.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify bookingMeta write
    const bookingMetaCall = mockFetch.mock.calls.find((call) => {
      const url = getUrlFromCall(call as unknown[]);
      return url.includes("/bookingMeta/6896451364.json");
    });
    expect(bookingMetaCall).toBeDefined();
    const metaBody = getBodyFromCall(bookingMetaCall as unknown[]);
    expect(metaBody).toContain('"status":"cancelled"');
  });

  // TC-02: Parse failure (malformed email) → returns {status: "parse-failed"}
  test("TC-02: should return parse-failed status for malformed email", async () => {
    const emailId = "msg_456";
    const emailHtml = "Random email with no reservation code";
    const from = "Octorate <noreply@smtp.octorate.com>";
    const firebaseUrl = "https://test.firebaseio.com";

    // Mock parser failure
    (parseCancellationEmail as jest.Mock).mockReturnValue(null);

    const result = await processCancellationEmail(
      emailId,
      emailHtml,
      from,
      firebaseUrl
    );

    expect(result.status).toBe("parse-failed");
    expect(result.reason).toMatch(/could not extract reservation code/i);

    // Should not make any Firebase calls
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // TC-03: Booking not found → returns {status: "booking-not-found"}
  test("TC-03: should return booking-not-found status when booking doesn't exist", async () => {
    const emailId = "msg_789";
    const emailHtml = "NEW CANCELLATION 9999999999_8888888888 Booking 2026-08-30";
    const from = "Octorate <noreply@smtp.octorate.com>";
    const firebaseUrl = "https://test.firebaseio.com";

    // Mock parser success
    (parseCancellationEmail as jest.Mock).mockReturnValue({
      reservationCode: "9999999999",
      provider: "octorate",
    });

    // Mock Firebase GET /bookings/{reservationCode} → returns null (not found)
    mockFetch.mockResolvedValueOnce(createMockResponse(null));

    const result = await processCancellationEmail(
      emailId,
      emailHtml,
      from,
      firebaseUrl
    );

    expect(result.status).toBe("booking-not-found");
    expect(result.reason).toMatch(/booking 9999999999 not found/i);

    // Should have called GET but no PATCH
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // TC-04: Firebase write failure → retries once, returns {status: "write-failed"}
  test("TC-04: should retry once on Firebase write failure and return write-failed", async () => {
    const emailId = "msg_101";
    const emailHtml = "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30";
    const from = "Octorate <noreply@smtp.octorate.com>";
    const firebaseUrl = "https://test.firebaseio.com";

    // Mock parser success
    (parseCancellationEmail as jest.Mock).mockReturnValue({
      reservationCode: "6896451364",
      provider: "octorate",
    });

    // Mock Firebase GET /bookings/{reservationCode} → success
    mockFetch.mockResolvedValueOnce(createMockResponse({ occ1: true }));

    // Mock Firebase PATCH /activities/{occupantId}/{activityId} → fails twice
    mockFetch.mockResolvedValueOnce(
      createMockResponse(null, { ok: false, status: 500, statusText: "Internal Server Error" })
    );
    mockFetch.mockResolvedValueOnce(
      createMockResponse(null, { ok: false, status: 500, statusText: "Internal Server Error" })
    );

    const result = await processCancellationEmail(
      emailId,
      emailHtml,
      from,
      firebaseUrl
    );

    expect(result.status).toBe("write-failed");
    expect(result.reason).toMatch(/Firebase write failed/i);

    // Should have tried activity write twice (initial + 1 retry)
    const activityCalls = (mockFetch.mock.calls as unknown[][]).filter((call) => {
      const url = getUrlFromCall(call);
      return url.includes("/activities/");
    });
    expect(activityCalls).toHaveLength(2);
  });

  // TC-05: Multi-occupant booking → activities written with unique activityIds (no collision)
  test("TC-05: should write activities with unique collision-safe activityIds for multi-occupant booking", async () => {
    const emailId = "msg_202";
    const emailHtml = "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30";
    const from = "Octorate <noreply@smtp.octorate.com>";
    const firebaseUrl = "https://test.firebaseio.com";

    // Mock parser success
    (parseCancellationEmail as jest.Mock).mockReturnValue({
      reservationCode: "6896451364",
      provider: "octorate",
    });

    // Mock Firebase GET /bookings/{reservationCode} → returns booking with 4 occupants
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ occ1: true, occ2: true, occ3: true, occ4: true })
    );

    // Mock Firebase PATCH for 4 activities + 1 bookingMeta
    mockFetch.mockResolvedValue(createMockResponse(null));

    const result = await processCancellationEmail(
      emailId,
      emailHtml,
      from,
      firebaseUrl
    );

    expect(result.status).toBe("success");
    expect(result.activitiesWritten).toBe(4);

    // Verify activity IDs are unique and collision-safe
    const activityCalls = (mockFetch.mock.calls as unknown[][]).filter((call) => {
      const url = getUrlFromCall(call);
      return url.includes("/activities/");
    });

    const activityIds = activityCalls.map((call) => {
      const url = getUrlFromCall(call);
      // URL format: https://test.firebaseio.com/activities/{occupantId}/{activityId}.json?auth=key
      const match = url.match(/\/activities\/[^/]+\/([^/.?]+)/);
      return match?.[1];
    });

    // Should have 4 unique activity IDs
    const uniqueIds = new Set(activityIds.filter((id) => id !== undefined));
    expect(uniqueIds.size).toBe(4);

    // Activity IDs should follow pattern: act_{timestamp}_{index}
    activityIds.forEach((id) => {
      if (id) {
        expect(id).toMatch(/^act_\d+_\d+$/);
      }
    });
  });

  // TC-06: Activity shape validation → includes code, timestamp, who fields
  test("TC-06: should write activities with correct shape (code, timestamp, who)", async () => {
    const emailId = "msg_303";
    const emailHtml = "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30";
    const from = "Octorate <noreply@smtp.octorate.com>";
    const firebaseUrl = "https://test.firebaseio.com";

    // Mock parser success
    (parseCancellationEmail as jest.Mock).mockReturnValue({
      reservationCode: "6896451364",
      provider: "octorate",
    });

    // Mock Firebase GET /bookings/{reservationCode} → returns booking with 1 occupant
    mockFetch.mockResolvedValueOnce(createMockResponse({ occ1: true }));

    // Mock Firebase PATCH for activity + bookingMeta
    mockFetch.mockResolvedValue(createMockResponse(null));

    const result = await processCancellationEmail(
      emailId,
      emailHtml,
      from,
      firebaseUrl
    );

    expect(result.status).toBe("success");

    // Find the activity write call
    const activityCall = (mockFetch.mock.calls as unknown[][]).find((call) => {
      const url = getUrlFromCall(call);
      return url.includes("/activities/");
    });

    expect(activityCall).toBeDefined();

    const activityBodyStr = getBodyFromCall(activityCall!);
    expect(activityBodyStr).not.toBeNull();
    const activityBody = JSON.parse(activityBodyStr!);

    // Verify activity shape
    expect(activityBody).toHaveProperty("code", 22);
    expect(activityBody).toHaveProperty("timestamp");
    expect(activityBody).toHaveProperty("who", "Octorate");

    // Verify timestamp is ISO format
    expect(activityBody.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
