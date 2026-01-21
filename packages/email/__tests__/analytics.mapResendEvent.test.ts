import { setupMocks } from "../src/__tests__/analyticsTestUtils";
import type { EmailAnalyticsEvent } from "../src/analytics";

describe("mapResendEvent", () => {
  it.each([
    ["email.delivered", "email_delivered"],
    ["email.opened", "email_open"],
    ["email.clicked", "email_click"],
    ["email.unsubscribed", "email_unsubscribe"],
    ["email.bounced", "email_bounce"],
  ])("maps %s events", async (evType, type) => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    const ev = {
      type: evType,
      data: {
        message_id: "r1",
        email: "user@example.com",
      },
    } as const;
    expect(mapResendEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type,
      campaign: undefined,
      messageId: "r1",
      recipient: "user@example.com",
    });
  });

  it("uses recipient if email is missing", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    const ev = {
      type: "email.delivered",
      data: {
        message_id: "r2",
        recipient: "alt@example.com",
      },
    } as const;
    expect(mapResendEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_delivered",
      campaign: undefined,
      messageId: "r2",
      recipient: "alt@example.com",
    });
  });

  it("handles events with only campaign_id", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    const ev = {
      type: "email.delivered",
      data: {
        campaign_id: "camp-1",
      },
    } as const;
    expect(mapResendEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_delivered",
      campaign: "camp-1",
      messageId: undefined,
      recipient: undefined,
    });
  });

  it("prefers explicit campaign over campaign_id", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    const ev = {
      type: "email.delivered",
      data: {
        campaign: "camp-explicit",
        campaign_id: "camp-1",
      },
    } as const;
    expect(mapResendEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_delivered",
      campaign: "camp-explicit",
      messageId: undefined,
      recipient: undefined,
    });
  });

  it("handles events without data", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    const ev = { type: "email.delivered" } as const;
    expect(mapResendEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_delivered",
      campaign: undefined,
      messageId: undefined,
      recipient: undefined,
    });
  });

  it("returns null for unknown types", async () => {
    setupMocks();
    const { mapResendEvent } = await import("../src/analytics");
    expect(mapResendEvent({ type: "email.unknown" } as any)).toBeNull();
  });
});

