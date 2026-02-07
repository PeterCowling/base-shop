import { setupMocks } from "./analyticsTestUtils";

jest.mock("@acme/zod-utils/initZod", () => ({}));

describe("analytics mapping", () => {
  it.each([
    ["delivered", "email_delivered"],
    ["open", "email_open"],
    ["click", "email_click"],
    ["unsubscribe", "email_unsubscribe"],
    ["bounce", "email_bounce"],
  ])("maps SendGrid %s events", async (event, type) => {
    setupMocks();
    const { mapSendGridEvent } = await import("../analytics");
    const ev = { event, sg_message_id: "msg", email: "user@example.com" };
    expect(mapSendGridEvent(ev)).toEqual({
      type,
      messageId: "msg",
      recipient: "user@example.com",
    });
  });

  it.each([
    ["email.delivered", "email_delivered"],
    ["email.opened", "email_open"],
    ["email.clicked", "email_click"],
    ["email.unsubscribed", "email_unsubscribe"],
    ["email.bounced", "email_bounce"],
  ])("maps Resend %s events", async (evType, type) => {
    setupMocks();
    const { mapResendEvent } = await import("../analytics");
    const ev = {
      type: evType,
      data: { message_id: "m1", email: "user@example.com" },
    };
    expect(mapResendEvent(ev)).toEqual({
      type,
      campaign: undefined,
      messageId: "m1",
      recipient: "user@example.com",
    });
  });

  it("maps SendGrid stats", async () => {
    setupMocks();
    const { mapSendGridStats } = await import("../analytics");
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

  it("maps Resend stats", async () => {
    setupMocks();
    const { mapResendStats } = await import("../analytics");
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
