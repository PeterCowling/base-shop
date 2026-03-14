import {
  buildThreadSummary,
  buildThreadSummaryFromRow,
  parseThreadMetadata,
  parseThreadMetadataFromRow,
} from "../api-models.server";
import type { InboxThreadRecord, InboxThreadRow, ThreadWithLatestDraftRow } from "../repositories.server";

/** Helper to build a minimal InboxThreadRow for testing. */
function buildTestThreadRow(overrides: Partial<InboxThreadRow> = {}): InboxThreadRow {
  return {
    id: "thread-test-1",
    status: "pending",
    subject: "Test subject",
    snippet: "Test snippet",
    assigned_uid: null,
    latest_message_at: "2026-03-12T10:00:00.000Z",
    last_synced_at: "2026-03-12T10:00:00.000Z",
    metadata_json: null,
    created_at: "2026-03-12T10:00:00.000Z",
    updated_at: "2026-03-12T10:00:00.000Z",
    ...overrides,
  };
}

describe("parseThreadMetadataFromRow", () => {
  it("returns empty-ish metadata for a row with all NULLs", () => {
    const row = buildTestThreadRow();
    const result = parseThreadMetadataFromRow(row);

    expect(result.needsManualDraft).toBeUndefined();
    expect(result.guestFirstName).toBeNull();
    expect(result.guestBookingRef).toBeNull();
    expect(result.recoveryAttempts).toBeNull();
  });

  it("reads promoted columns when present", () => {
    const row = buildTestThreadRow({
      needs_manual_draft: 1,
      guest_first_name: "Alice",
      guest_last_name: "Smith",
      guest_booking_ref: "BK-123",
      guest_room_numbers_json: JSON.stringify(["101", "102"]),
      recovery_attempts: 2,
      last_draft_quality_passed: 0,
    });
    const result = parseThreadMetadataFromRow(row);

    expect(result.needsManualDraft).toBe(true);
    expect(result.guestFirstName).toBe("Alice");
    expect(result.guestLastName).toBe("Smith");
    expect(result.guestBookingRef).toBe("BK-123");
    expect(result.guestRoomNumbers).toEqual(["101", "102"]);
    expect(result.recoveryAttempts).toBe(2);
    expect(result.lastDraftQualityPassed).toBe(false);
  });

  it("falls back to metadata_json when columns are NULL", () => {
    const row = buildTestThreadRow({
      metadata_json: JSON.stringify({
        needsManualDraft: true,
        guestFirstName: "Bob",
        guestRoomNumbers: ["201"],
        recoveryAttempts: 1,
        gmailHistoryId: "hist-abc",
        lastSyncMode: "incremental",
      }),
    });
    const result = parseThreadMetadataFromRow(row);

    expect(result.needsManualDraft).toBe(true);
    expect(result.guestFirstName).toBe("Bob");
    expect(result.guestRoomNumbers).toEqual(["201"]);
    expect(result.recoveryAttempts).toBe(1);
    // metadata_json-only fields
    expect(result.gmailHistoryId).toBe("hist-abc");
    expect(result.lastSyncMode).toBe("incremental");
  });

  it("column values take precedence over metadata_json", () => {
    const row = buildTestThreadRow({
      guest_first_name: "ColumnAlice",
      metadata_json: JSON.stringify({
        guestFirstName: "JsonBob",
        guestLastName: "JsonSmith",
      }),
    });
    const result = parseThreadMetadataFromRow(row);

    // Column wins
    expect(result.guestFirstName).toBe("ColumnAlice");
    // Falls back for field not in columns
    expect(result.guestLastName).toBe("JsonSmith");
  });

  it("handles malformed metadata_json gracefully", () => {
    const row = buildTestThreadRow({
      metadata_json: "not-valid-json",
      guest_first_name: "Alice",
    });
    const result = parseThreadMetadataFromRow(row);

    expect(result.guestFirstName).toBe("Alice");
    expect(result.guestLastName).toBeNull();
  });

  it("handles guestRoomNumbers as JSON string in column", () => {
    const row = buildTestThreadRow({
      guest_room_numbers_json: '["301","302"]',
    });
    const result = parseThreadMetadataFromRow(row);

    expect(result.guestRoomNumbers).toEqual(["301", "302"]);
  });

  it("handles invalid JSON in guest_room_numbers_json column", () => {
    const row = buildTestThreadRow({
      guest_room_numbers_json: "not-json",
      metadata_json: JSON.stringify({ guestRoomNumbers: ["401"] }),
    });
    const result = parseThreadMetadataFromRow(row);

    // Falls back to metadata_json when column parse fails
    expect(result.guestRoomNumbers).toEqual(["401"]);
  });
});

describe("parseThreadMetadata (legacy string parser)", () => {
  it("returns empty object for null input", () => {
    expect(parseThreadMetadata(null)).toEqual({});
  });

  it("returns empty object for undefined input", () => {
    expect(parseThreadMetadata(undefined)).toEqual({});
  });

  it("parses valid JSON", () => {
    const result = parseThreadMetadata(
      JSON.stringify({ needsManualDraft: true, guestFirstName: "Test" }),
    );
    expect(result.needsManualDraft).toBe(true);
    expect(result.guestFirstName).toBe("Test");
  });

  it("returns empty object for malformed JSON", () => {
    expect(parseThreadMetadata("not-json")).toEqual({});
  });
});

// TC-01: buildThreadSummary sets source: "email"
describe("buildThreadSummary", () => {
  it("TC-01: sets source: 'email' on the returned thread summary", () => {
    const record: InboxThreadRecord = {
      thread: {
        id: "thread-summary-1",
        status: "pending",
        subject: "Test",
        snippet: "snippet",
        assigned_uid: null,
        latest_message_at: "2026-03-14T10:00:00.000Z",
        last_synced_at: "2026-03-14T10:00:00.000Z",
        metadata_json: null,
        created_at: "2026-03-14T10:00:00.000Z",
        updated_at: "2026-03-14T10:00:00.000Z",
      },
      messages: [],
      drafts: [],
      events: [],
      admissionOutcomes: [],
    };

    const result = buildThreadSummary(record);

    expect(result.source).toBe("email");
  });
});

// TC-02: buildThreadSummaryFromRow sets source: "email"
describe("buildThreadSummaryFromRow", () => {
  it("TC-02: sets source: 'email' on the returned thread summary", () => {
    const row: ThreadWithLatestDraftRow = {
      id: "thread-row-1",
      status: "pending",
      subject: "Test row",
      snippet: "snippet row",
      assigned_uid: null,
      latest_message_at: "2026-03-14T10:00:00.000Z",
      last_synced_at: "2026-03-14T10:00:00.000Z",
      metadata_json: null,
      created_at: "2026-03-14T10:00:00.000Z",
      updated_at: "2026-03-14T10:00:00.000Z",
      draft_id: null,
      draft_thread_id: null,
      draft_gmail_draft_id: null,
      draft_status: null,
      draft_subject: null,
      draft_recipient_emails_json: null,
      draft_plain_text: null,
      draft_html: null,
      draft_original_plain_text: null,
      draft_original_html: null,
      draft_template_used: null,
      draft_quality_json: null,
      draft_interpret_json: null,
      draft_created_by_uid: null,
      draft_created_at: null,
      draft_updated_at: null,
    };

    const result = buildThreadSummaryFromRow(row);

    expect(result.source).toBe("email");
  });
});
