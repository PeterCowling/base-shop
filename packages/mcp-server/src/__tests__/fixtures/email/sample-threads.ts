/**
 * Shared Gmail thread/message test fixtures.
 *
 * Factory functions produce objects matching the Gmail API shapes used by
 * the gmail-organize-inbox and related test suites. Each factory accepts an
 * optional `Partial<>` overrides parameter so callers can selectively
 * replace fields while keeping sensible defaults.
 */

// ---------------------------------------------------------------------------
// Types — mirrors the local types in gmail-organize-inbox.test.ts
// ---------------------------------------------------------------------------

export type GmailHeader = { name: string; value: string };

export type GmailPayload = {
  headers: GmailHeader[];
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayload[];
};

export type GmailMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  payload: GmailPayload;
  snippet?: string;
};

export type GmailThread = {
  id: string;
  messages: GmailMessage[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function createHeader(name: string, value: string): GmailHeader {
  return { name, value };
}

export function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ---------------------------------------------------------------------------
// Message factory
// ---------------------------------------------------------------------------

export type GmailMessageOverrides = Partial<Omit<GmailMessage, "payload">> & {
  payload?: Partial<GmailPayload>;
  /** Shorthand: override individual header values by name. */
  headers?: Record<string, string>;
};

/**
 * Build a single GmailMessage with sensible defaults.
 * All fields can be overridden; `headers` shorthand merges with default headers.
 */
export function makeGmailMessage(overrides: GmailMessageOverrides = {}): GmailMessage {
  const {
    headers: headerOverrides,
    payload: payloadOverrides,
    ...rest
  } = overrides;

  const defaultHeaders: GmailHeader[] = [
    createHeader("From", "guest@example.com"),
    createHeader("Subject", "Question about check-in"),
    createHeader("Date", "Tue, 10 Feb 2026 12:00:00 +0000"),
  ];

  // Merge header overrides into defaults (by name)
  const mergedHeaders = [...defaultHeaders];
  if (headerOverrides) {
    for (const [name, value] of Object.entries(headerOverrides)) {
      const existing = mergedHeaders.findIndex((h) => h.name === name);
      if (existing >= 0) {
        mergedHeaders[existing] = createHeader(name, value);
      } else {
        mergedHeaders.push(createHeader(name, value));
      }
    }
  }

  const payload: GmailPayload = {
    headers: mergedHeaders,
    ...payloadOverrides,
  };

  // If payloadOverrides supplied headers, use those instead of merged
  if (payloadOverrides?.headers) {
    payload.headers = payloadOverrides.headers;
  }

  return {
    id: "msg-1",
    threadId: "thread-1",
    labelIds: ["INBOX", "UNREAD"],
    payload,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Thread factory
// ---------------------------------------------------------------------------

export type GmailThreadOverrides = Partial<Omit<GmailThread, "messages">> & {
  messages?: GmailMessage[];
};

/**
 * Build a GmailThread with sensible defaults (single message).
 */
export function makeGmailThread(overrides: GmailThreadOverrides = {}): GmailThread {
  const { messages, ...rest } = overrides;
  const threadId = rest.id ?? "thread-1";

  return {
    id: threadId,
    messages: messages ?? [
      makeGmailMessage({ threadId, id: `msg-${threadId}` }),
    ],
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Pre-built thread factories
// ---------------------------------------------------------------------------

/**
 * A basic single-message thread from a guest with a simple question.
 */
export function makeSingleMessageThread(
  overrides: GmailThreadOverrides = {},
): GmailThread {
  const threadId = overrides.id ?? "thread-single";
  return makeGmailThread({
    id: threadId,
    messages: [
      makeGmailMessage({
        id: "msg-single-1",
        threadId,
        headers: {
          From: "Alice Brown <alice@example.com>",
          Subject: "Check-in time question",
          Date: "Mon, 09 Feb 2026 14:00:00 +0000",
        },
      }),
    ],
    ...overrides,
  });
}

/**
 * A multi-message thread simulating a guest reply chain (3 messages).
 * Guest asks, staff replies, guest follows up.
 */
export function makeMultiMessageThread(
  overrides: GmailThreadOverrides = {},
): GmailThread {
  const threadId = overrides.id ?? "thread-multi";
  return makeGmailThread({
    id: threadId,
    messages: overrides.messages ?? [
      makeGmailMessage({
        id: "msg-multi-1",
        threadId,
        headers: {
          From: "\"Bob Chen\" <bob.chen@example.com>",
          Subject: "Pre-arrival questions",
          Date: "Mon, 09 Feb 2026 10:00:00 +0000",
        },
      }),
      makeGmailMessage({
        id: "msg-multi-2",
        threadId,
        labelIds: ["SENT"],
        headers: {
          From: "Hostel Brikette <info@hostel-positano.com>",
          Subject: "Re: Pre-arrival questions",
          Date: "Mon, 09 Feb 2026 11:30:00 +0000",
        },
      }),
      makeGmailMessage({
        id: "msg-multi-3",
        threadId,
        headers: {
          From: "\"Bob Chen\" <bob.chen@example.com>",
          Subject: "Re: Pre-arrival questions",
          Date: "Mon, 09 Feb 2026 15:00:00 +0000",
        },
      }),
    ],
    ...overrides,
  });
}

/**
 * A booking notification thread from Booking.com via the OTA relay address.
 * Matches the typical format used in gmail-organize-inbox tests.
 */
export function makeBookingNotificationThread(
  overrides: GmailThreadOverrides = {},
): GmailThread {
  const threadId = overrides.id ?? "thread-booking";
  return makeGmailThread({
    id: threadId,
    messages: overrides.messages ?? [
      makeGmailMessage({
        id: "msg-booking-1",
        threadId,
        headers: {
          From: "\"Guest Name through Booking.com\" <123@guest.booking.com>",
          Subject: "We received this message from Guest Name",
          Date: "Tue, 10 Feb 2026 12:00:00 +0000",
        },
      }),
    ],
    ...overrides,
  });
}

/**
 * An Octorate NEW RESERVATION thread with HTML body containing reservation
 * details. Matches the shape used for booking-reservation handler tests.
 */
export function makeOctorateReservationThread(
  overrides: GmailThreadOverrides = {},
): GmailThread {
  const threadId = overrides.id ?? "thread-octorate-reservation";
  return makeGmailThread({
    id: threadId,
    messages: overrides.messages ?? [
      makeGmailMessage({
        id: "msg-octorate-res-1",
        threadId,
        payload: {
          mimeType: "multipart/alternative",
          headers: [
            createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
            createHeader(
              "Subject",
              "NEW RESERVATION 6355834117_6080280211 Booking 2026-07-11",
            ),
            createHeader("Date", "Wed, 11 Feb 2026 07:15:07 +0100"),
          ],
          parts: [
            {
              mimeType: "text/plain",
              body: {
                data: encodeBase64Url(
                  "NEW RESERVATION 6355834117_6080280211 Booking 2026-07-11 - 2026-07-13",
                ),
              },
              headers: [],
            },
            {
              mimeType: "text/html",
              body: {
                data: encodeBase64Url(`
                  <table>
                    <tr><td><b>reservation code</b></td><td>6355834117_6080280211</td></tr>
                    <tr><td><b>guest name</b></td><td>John Example</td></tr>
                    <tr><td>email</td><td><a href="mailto:john.guest@example.com">john.guest@example.com</a></td></tr>
                    <tr><td><b>check in</b></td><td>2026-07-11</td></tr>
                    <tr><td><b>nights</b></td><td>2</td></tr>
                    <tr><td><b>total amount</b></td><td>274.19</td></tr>
                    <tr><td><b>Room 7</b></td><td>OTA, Non Refundable</td></tr>
                  </table>
                `),
              },
              headers: [],
            },
          ],
        },
      }),
    ],
    ...overrides,
  });
}
