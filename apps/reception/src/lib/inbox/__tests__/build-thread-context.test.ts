import type { ParsedGmailThread, ParsedGmailThreadMessage } from "../../gmail-client";
import {
  boundMessages,
  buildThreadContext,
  MAX_THREAD_CONTEXT_MESSAGES,
} from "../thread-context";

function makeMockMessage(
  index: number,
  overrides?: Partial<ParsedGmailThreadMessage>,
): ParsedGmailThreadMessage {
  const date = new Date(2026, 0, 1 + index).toISOString();
  return {
    id: `msg-${index}`,
    threadId: "thread-1",
    labelIds: [],
    historyId: null,
    snippet: `snippet-${index}`,
    internalDate: date,
    receivedAt: date,
    from: `sender-${index}@example.com`,
    to: ["inbox@hostel.com"],
    subject: `Subject ${index}`,
    inReplyTo: null,
    references: null,
    body: { plain: `Full body text for message ${index}. This is the complete email content.` },
    attachments: [],
    ...overrides,
  };
}

function makeMockThread(messageCount: number): ParsedGmailThread {
  return {
    id: "thread-1",
    historyId: "12345",
    snippet: "thread snippet",
    messages: Array.from({ length: messageCount }, (_, index) => makeMockMessage(index)),
  };
}

describe("MAX_THREAD_CONTEXT_MESSAGES", () => {
  it("is exported and equals 20", () => {
    expect(MAX_THREAD_CONTEXT_MESSAGES).toBe(20);
  });
});

describe("buildThreadContext", () => {
  it("TC-04: returns empty messages array for thread with 0 messages", () => {
    const thread = makeMockThread(0);
    const result = buildThreadContext(thread);
    expect(result.messages).toEqual([]);
  });

  it("TC-01: includes all messages when count is below the bound (5 messages)", () => {
    const thread = makeMockThread(5);
    const result = buildThreadContext(thread);
    expect(result.messages).toHaveLength(5);
  });

  it("includes all messages at the exact boundary (20 messages)", () => {
    const thread = makeMockThread(20);
    const result = buildThreadContext(thread);
    expect(result.messages).toHaveLength(20);
  });

  it("TC-02: bounds to 20 most recent messages when thread has 25", () => {
    const thread = makeMockThread(25);
    const result = buildThreadContext(thread);
    expect(result.messages).toHaveLength(MAX_THREAD_CONTEXT_MESSAGES);
    // Oldest 5 messages (index 0-4) should be dropped
    expect(result.messages[0].from).toBe("sender-5@example.com");
    expect(result.messages[result.messages.length - 1].from).toBe("sender-24@example.com");
  });

  it("TC-03: bounds to 20 most recent messages when thread has 50", () => {
    const thread = makeMockThread(50);
    const result = buildThreadContext(thread);
    expect(result.messages).toHaveLength(MAX_THREAD_CONTEXT_MESSAGES);
    // Oldest 30 messages (index 0-29) should be dropped
    expect(result.messages[0].from).toBe("sender-30@example.com");
    expect(result.messages[result.messages.length - 1].from).toBe("sender-49@example.com");
  });

  it("TC-05: messages are sorted by date ascending (most recent last)", () => {
    // Create messages in reverse order to test sorting
    const thread: ParsedGmailThread = {
      id: "thread-1",
      historyId: "12345",
      snippet: "thread snippet",
      messages: [
        makeMockMessage(5),
        makeMockMessage(1),
        makeMockMessage(3),
        makeMockMessage(2),
        makeMockMessage(4),
      ],
    };
    const result = buildThreadContext(thread);
    const dates = result.messages.map((message) => message.date);
    const sortedDates = [...dates].sort();
    expect(dates).toEqual(sortedDates);
  });

  it("TC-06: messages with null dates sort to beginning and are dropped first", () => {
    const messages = Array.from({ length: 22 }, (_, index) => {
      if (index < 3) {
        return makeMockMessage(index, { receivedAt: null, internalDate: null });
      }
      return makeMockMessage(index);
    });
    const thread: ParsedGmailThread = {
      id: "thread-1",
      historyId: "12345",
      snippet: "thread snippet",
      messages,
    };
    const result = buildThreadContext(thread);
    expect(result.messages).toHaveLength(MAX_THREAD_CONTEXT_MESSAGES);
    // The 3 messages with null dates (index 0-2) get empty string dates,
    // sort to the beginning, and should be dropped since 22 > 20
    // The 2 oldest dated messages should also be dropped
    expect(result.messages.every((message) => message.date !== "")).toBe(true);
  });

  it("maps message fields correctly", () => {
    const thread = makeMockThread(1);
    const result = buildThreadContext(thread);
    expect(result.messages[0]).toEqual({
      from: "sender-0@example.com",
      date: expect.any(String),
      snippet: "Full body text for message 0. This is the complete email content.",
    });
  });

  it("uses snippet as fallback when body.plain is empty", () => {
    const thread: ParsedGmailThread = {
      id: "thread-1",
      historyId: "12345",
      snippet: "thread snippet",
      messages: [makeMockMessage(0, { body: { plain: "" } })],
    };
    const result = buildThreadContext(thread);
    expect(result.messages[0].snippet).toBe("snippet-0");
  });

  it("uses 'Unknown sender' when from is null", () => {
    const thread: ParsedGmailThread = {
      id: "thread-1",
      historyId: "12345",
      snippet: "thread snippet",
      messages: [makeMockMessage(0, { from: null })],
    };
    const result = buildThreadContext(thread);
    expect(result.messages[0].from).toBe("Unknown sender");
  });
});

describe("boundMessages", () => {
  it("returns all messages when count is within bound", () => {
    const messages = Array.from({ length: 5 }, (_, index) => ({
      from: `sender-${index}@example.com`,
      date: new Date(2026, 0, 1 + index).toISOString(),
      snippet: `message ${index}`,
    }));
    const result = boundMessages(messages);
    expect(result).toHaveLength(5);
  });

  it("returns bounded messages when count exceeds limit", () => {
    const messages = Array.from({ length: 30 }, (_, index) => ({
      from: `sender-${index}@example.com`,
      date: new Date(2026, 0, 1 + index).toISOString(),
      snippet: `message ${index}`,
    }));
    const result = boundMessages(messages);
    expect(result).toHaveLength(MAX_THREAD_CONTEXT_MESSAGES);
    expect(result[0].from).toBe("sender-10@example.com");
    expect(result[result.length - 1].from).toBe("sender-29@example.com");
  });

  it("sorts messages by date ascending", () => {
    const messages = [
      { from: "c@test.com", date: "2026-01-03T00:00:00.000Z", snippet: "c" },
      { from: "a@test.com", date: "2026-01-01T00:00:00.000Z", snippet: "a" },
      { from: "b@test.com", date: "2026-01-02T00:00:00.000Z", snippet: "b" },
    ];
    const result = boundMessages(messages);
    expect(result.map((m) => m.from)).toEqual(["a@test.com", "b@test.com", "c@test.com"]);
  });
});
