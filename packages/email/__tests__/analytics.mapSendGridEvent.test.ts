import type { EmailAnalyticsEvent } from "../src/analytics";
import { setupMocks } from "../src/__tests__/analyticsTestUtils";

describe("mapSendGridEvent", () => {
  it.each([
    ["delivered", "email_delivered"],
    ["open", "email_open"],
    ["click", "email_click"],
    ["unsubscribe", "email_unsubscribe"],
    ["bounce", "email_bounce"],
  ])("maps %s events", async (event, type) => {
    setupMocks();
    const { mapSendGridEvent } = await import("../src/analytics");
    const ev = {
      event,
      sg_message_id: "m1",
      email: "user@example.com",
    } as const;
    expect(mapSendGridEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type,
      messageId: "m1",
      recipient: "user@example.com",
    });
  });

  it("returns null for unknown events", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../src/analytics");
    expect(mapSendGridEvent({ event: "processed" } as any)).toBeNull();
  });

  it("maps category strings to campaigns", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../src/analytics");
    const ev = {
      event: "open",
      category: "camp1",
      sg_message_id: "m1",
      email: "user@example.com",
    } as const;
    expect(mapSendGridEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_open",
      campaign: "camp1",
      messageId: "m1",
      recipient: "user@example.com",
    });
  });

  it("omits campaign when category is missing", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../src/analytics");
    const ev = {
      event: "open",
      sg_message_id: "m3",
      email: "user@example.com",
    } as const;
    const result = mapSendGridEvent(ev);
    expect(result).toEqual<EmailAnalyticsEvent>({
      type: "email_open",
      messageId: "m3",
      recipient: "user@example.com",
    });
    expect(result).not.toHaveProperty("campaign");
  });

  it("uses the first value from category arrays", async () => {
    setupMocks();
    const { mapSendGridEvent } = await import("../src/analytics");
    const ev = {
      event: "open",
      sg_message_id: "m2",
      email: "user@example.com",
      category: ["camp1", "camp2"],
    } as const;
    expect(mapSendGridEvent(ev)).toEqual<EmailAnalyticsEvent>({
      type: "email_open",
      campaign: "camp1",
      messageId: "m2",
      recipient: "user@example.com",
    });
  });
});

