import {
  mapSendGridStats,
  mapResendStats,
  normalizeProviderStats,
  emptyStats,
} from "../stats";

describe("mapSendGridStats", () => {
  it("converts mixed string/number fields", () => {
    const raw = {
      delivered: "1",
      opens: 2,
      clicked: "3",
      unsubscribes: "4",
      bounces: 5,
    };

    expect(mapSendGridStats(raw)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });
});

describe("mapResendStats", () => {
  it("supports *_count and short forms", () => {
    const raw = {
      delivered_count: "1",
      opened: "2",
      clicked_count: 3,
      unsubscribed: 4,
      bounced_count: "5",
    };

    expect(mapResendStats(raw)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });
});

describe("normalizeProviderStats", () => {
  it("returns empty stats for unknown provider", () => {
    expect(normalizeProviderStats("unknown", undefined)).toEqual(emptyStats);
  });

  it("normalizes sendgrid stats", () => {
    const raw = {
      delivered: "1",
      opens: "2",
      clicks: "3",
      unsubscribes: "4",
      bounces: "5",
    };

    expect(normalizeProviderStats("sendgrid", raw)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });

  it("normalizes resend stats", () => {
    const raw = {
      delivered_count: "1",
      opened: 2,
      clicked_count: "3",
      unsubscribed: "4",
      bounced_count: 5,
    };

    expect(normalizeProviderStats("resend", raw)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });
});
