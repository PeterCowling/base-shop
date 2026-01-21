import { setupMocks } from "./analyticsTestUtils";

jest.mock("@acme/zod-utils/initZod", () => ({}));

describe("webhook normalization", () => {
  it("normalizes SendGrid webhook events with multi-value array category", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../analytics");
    const ev = {
      event: "open",
      sg_message_id: "msg-1",
      email: "user@example.com",
      category: ["a", "b"],
    };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      campaign: "a",
      messageId: "msg-1",
      recipient: "user@example.com",
    });
  });

  it("normalizes SendGrid webhook events with string category", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../analytics");
    const ev = {
      event: "open",
      sg_message_id: "msg-2",
      email: "user@example.com",
      category: "camp2",
    };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      campaign: "camp2",
      messageId: "msg-2",
      recipient: "user@example.com",
    });
  });

  it("normalizes SendGrid webhook events without category", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../analytics");
    const ev = {
      event: "open",
      sg_message_id: "msg-3",
      email: "user@example.com",
      category: undefined,
    } as const;
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      messageId: "msg-3",
      recipient: "user@example.com",
    });
  });

  it("handles SendGrid events without sg_message_id", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../analytics");
    const ev = { event: "open", email: "user@example.com" };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      messageId: undefined,
      recipient: "user@example.com",
    });
  });

  it("handles SendGrid events without email", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../analytics");
    const ev = { event: "open", sg_message_id: "msg-4" };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      messageId: "msg-4",
      recipient: undefined,
    });
  });

  it("normalizes Resend webhook events with campaign_id", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: {
        message_id: "m2",
        email: "user@example.com",
        campaign_id: "camp1",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: "camp1",
      messageId: "m2",
      recipient: "user@example.com",
    });
  });

  it("normalizes Resend webhook events with campaign", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: {
        message_id: "m4",
        email: "user@example.com",
        campaign: "camp2",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: "camp2",
      messageId: "m4",
      recipient: "user@example.com",
    });
  });

  it("normalizes Resend webhook events with missing data", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../analytics");
    const ev = { type: "email.opened" } as any;
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: undefined,
      messageId: undefined,
      recipient: undefined,
    });
  });

  it("uses recipient when email is missing", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: { recipient: "user@example.com" },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: undefined,
      messageId: undefined,
      recipient: "user@example.com",
    });
  });

  it("uses email when both email and recipient are provided", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: {
        email: "user@example.com",
        recipient: "other@example.com",
        message_id: "m5",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: undefined,
      messageId: "m5",
      recipient: "user@example.com",
    });
  });

  it("returns null for unknown SendGrid events", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../analytics");
    expect(mapSendGridEvent({ event: "other" })).toBeNull();
  });

  it("returns null for unknown Resend types", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../analytics");
    expect(mapResendEvent({ type: "email.unknown" })).toBeNull();
  });

  it("resolves campaign from data.campaign", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: "email.opened",
      data: {
        message_id: "m3",
        email: "user@example.com",
        campaign: "campX",
        campaign_id: "campY",
      },
    };
    expect(mapResendEvent(ev)).toEqual({
      type: "email_open",
      campaign: "campX",
      messageId: "m3",
      recipient: "user@example.com",
    });
  });
});
