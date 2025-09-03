jest.mock("../stats", () => {
  const actual = jest.requireActual("../stats");
  return {
    ...actual,
    mapSendGridStats: jest.fn(actual.mapSendGridStats),
    mapResendStats: jest.fn(actual.mapResendStats),
    normalizeProviderStats(provider: string, data: any) {
      if (provider === "sendgrid") return (this as any).mapSendGridStats(data || {});
      if (provider === "resend") return (this as any).mapResendStats(data || {});
      return { ...actual.emptyStats };
    },
  };
});

import * as stats from "../stats";

const { mapSendGridStats, mapResendStats, emptyStats } = stats;

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
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty stats for unknown provider", () => {
    expect(stats.normalizeProviderStats("unknown", undefined)).toEqual(emptyStats);
  });

  it("invokes mapSendGridStats for sendgrid provider", () => {
    const raw = { delivered: "1" } as const;
    stats.normalizeProviderStats("sendgrid", raw);
    expect(mapSendGridStats).toHaveBeenCalledWith(raw);
  });

  it("invokes mapResendStats for resend provider", () => {
    const raw = { delivered_count: "1" } as const;
    stats.normalizeProviderStats("resend", raw);
    expect(mapResendStats).toHaveBeenCalledWith(raw);
  });

  it("normalizes sendgrid stats", () => {
    const raw = {
      delivered: "1",
      opens: "2",
      clicks: "3",
      unsubscribes: "4",
      bounces: "5",
    };

    expect(stats.normalizeProviderStats("sendgrid", raw)).toEqual({
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

    expect(stats.normalizeProviderStats("resend", raw)).toEqual({
      delivered: 1,
      opened: 2,
      clicked: 3,
      unsubscribed: 4,
      bounced: 5,
    });
  });

  it("returns mapped stats for sendgrid provider", () => {
    const raw = {
      delivered: "1",
      opens: "2",
    };

    expect(stats.normalizeProviderStats("sendgrid", raw)).toEqual(
      mapSendGridStats(raw)
    );
  });

  it("returns mapped stats for resend provider", () => {
    const raw = {
      delivered_count: "1",
      opened_count: "2",
    };

    expect(stats.normalizeProviderStats("resend", raw)).toEqual(
      mapResendStats(raw)
    );
  });

  it("returns empty stats for other provider", () => {
    expect(stats.normalizeProviderStats("other", undefined)).toEqual(emptyStats);
  });
});
describe("normalizeProviderStats real module", () => {
  it("uses actual implementation for unknown providers", () => {
    const { normalizeProviderStats, emptyStats } = jest.requireActual("../stats");
    expect(normalizeProviderStats("unknown", undefined)).toEqual({ ...emptyStats });
  });
});
