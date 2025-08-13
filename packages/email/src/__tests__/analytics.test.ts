import { mapSendGridEvent, mapResendEvent, mapSendGridStats, mapResendStats } from "../analytics";

describe("analytics mapping", () => {
  it("normalizes SendGrid webhook events", () => {
    const ev = {
      event: "open",
      sg_message_id: "msg-1",
      email: "user@example.com",
      category: ["camp1"],
    };
    expect(mapSendGridEvent(ev)).toEqual({
      type: "email_open",
      campaign: "camp1",
      messageId: "msg-1",
      recipient: "user@example.com",
    });
  });

  it("normalizes Resend webhook events", () => {
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

  it("maps SendGrid stats", () => {
    const stats = {
      delivered: 1,
      opens: 2,
      clicks: 3,
      unsubscribes: 4,
      bounces: 5,
    };
    expect(mapSendGridStats(stats)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });

  it("maps Resend stats", () => {
    const stats = {
      delivered_count: 1,
      opened_count: 2,
      clicked_count: 3,
      unsubscribed_count: 4,
      bounced_count: 5,
    };
    expect(mapResendStats(stats)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });
});
