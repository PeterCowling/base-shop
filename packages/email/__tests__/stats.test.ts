import { emptyStats,mapResendStats, mapSendGridStats, normalizeProviderStats } from "../src/analytics";

describe("provider stats mapping", () => {
  it("normalizes SendGrid stats including string numbers", () => {
    const raw = {
      delivered: "1",
      opens: "2",
      clicks: "3",
      unsubscribes: "4",
      bounces: "5",
    };
    expect(mapSendGridStats(raw)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });

  it("normalizes Resend stats with alternate keys", () => {
    const raw = {
      delivered_count: "6",
      opened_count: "7",
      clicked_count: "8",
      unsubscribed_count: "9",
      bounced_count: "10",
    };
    expect(mapResendStats(raw)).toEqual({
      delivered: 6,
      opened: 7,
      clicked: 8,
      unsubscribed: 9,
      bounced: 10,
    });
  });

  it("uses normalizeProviderStats and falls back to empty stats", () => {
    expect(normalizeProviderStats("sendgrid", { delivered: 2 })).toEqual({
      ...emptyStats,
      delivered: 2,
    });
    expect(normalizeProviderStats("sendgrid", undefined)).toEqual(emptyStats);
    expect(normalizeProviderStats("resend", { opened: "3" })).toEqual({
      ...emptyStats,
      opened: 3,
    });
    expect(normalizeProviderStats("resend", undefined)).toEqual(emptyStats);
    expect(normalizeProviderStats("other", { delivered: 99 })).toEqual(emptyStats);
  });
});
