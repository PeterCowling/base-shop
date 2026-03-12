import { threadMetadataSchema } from "../repositories.server";

jest.mock("server-only", () => ({}));

describe("threadMetadataSchema", () => {
  it("accepts valid complete metadata", () => {
    const valid = {
      latestInboundMessageId: "msg_123",
      latestInboundAt: "2026-03-12T10:00:00Z",
      latestInboundSender: "guest@example.com",
      latestAdmissionDecision: "admit",
      latestAdmissionReason: "guest inquiry",
      needsManualDraft: false,
      draftFailureCode: null,
      draftFailureMessage: null,
      lastProcessedAt: "2026-03-12T10:00:00Z",
      lastDraftId: "draft_abc",
      lastDraftTemplateSubject: "Re: Booking",
      lastDraftQualityPassed: true,
      guestBookingRef: "7763-12345",
      guestOccupantId: "occ_99",
      guestFirstName: "Alice",
      guestLastName: "Smith",
      guestCheckIn: "2026-03-14",
      guestCheckOut: "2026-03-17",
      guestRoomNumbers: ["101", "102"],
      recoveryAttempts: 2,
      gmailHistoryId: "hist_456",
      lastSyncMode: "incremental",
    };

    const result = threadMetadataSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts empty metadata", () => {
    const result = threadMetadataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("strips unknown keys silently", () => {
    const withExtra = {
      latestInboundMessageId: "msg_1",
      unknownField: "should be stripped",
      anotherUnknown: 42,
    };

    const result = threadMetadataSchema.safeParse(withExtra);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty("latestInboundMessageId", "msg_1");
      expect(result.data).not.toHaveProperty("unknownField");
      expect(result.data).not.toHaveProperty("anotherUnknown");
    }
  });

  it("rejects wrong types for known fields", () => {
    const wrongTypes = {
      needsManualDraft: "not-a-boolean",
      recoveryAttempts: "not-a-number",
      guestRoomNumbers: "not-an-array",
    };

    const result = threadMetadataSchema.safeParse(wrongTypes);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("needsManualDraft");
      expect(paths).toContain("recoveryAttempts");
      expect(paths).toContain("guestRoomNumbers");
    }
  });

  it("accepts null and undefined values for optional fields", () => {
    const withNulls = {
      latestInboundMessageId: null,
      needsManualDraft: undefined,
      guestRoomNumbers: null,
    };

    const result = threadMetadataSchema.safeParse(withNulls);
    expect(result.success).toBe(true);
  });

  it("rejects non-integer recoveryAttempts", () => {
    const result = threadMetadataSchema.safeParse({ recoveryAttempts: 1.5 });
    expect(result.success).toBe(false);
  });
});
