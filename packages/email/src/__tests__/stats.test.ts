import * as stats from "../stats";

const { mapSendGridStats, mapResendStats, emptyStats, normalizeProviderStats } =
  stats;

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
  it("uses sendgrid mapper for sendgrid provider", () => {
    const raw = { delivered: "1" } as const;
    expect(normalizeProviderStats("sendgrid", raw)).toEqual(
      mapSendGridStats(raw)
    );
  });

  it("normalizes resend stats with string counts", () => {
    expect(
      normalizeProviderStats("resend", { opened: "2" })
    ).toEqual({
      ...emptyStats,
      opened: 2,
    });
  });

  it("returns empty stats clone for unsupported provider", () => {
    const result = normalizeProviderStats("unsupported", { opened: "2" });
    expect(result).toEqual(emptyStats);
    expect(result).not.toBe(emptyStats);
  });
});
