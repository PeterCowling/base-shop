import * as stats from "../stats";

const sgFields = [
  "delivered",
  "opens",
  "clicks",
  "unsubscribes",
  "bounces",
] as const;
const sgAlt: Record<(typeof sgFields)[number], string> = {
  delivered: "delivered",
  opens: "opened",
  clicks: "clicked",
  unsubscribes: "unsubscribed",
  bounces: "bounced",
};
const sgResultKey: Record<
  (typeof sgFields)[number],
  keyof stats.CampaignStats
> = {
  delivered: "delivered",
  opens: "opened",
  clicks: "clicked",
  unsubscribes: "unsubscribed",
  bounces: "bounced",
};

const reFields = [
  "delivered",
  "opened",
  "clicked",
  "unsubscribed",
  "bounced",
] as const;
const reCount: Record<(typeof reFields)[number], string> = {
  delivered: "delivered_count",
  opened: "opened_count",
  clicked: "clicked_count",
  unsubscribed: "unsubscribed_count",
  bounced: "bounced_count",
};
const reResultKey: Record<
  (typeof reFields)[number],
  keyof stats.CampaignStats
> = {
  delivered: "delivered",
  opened: "opened",
  clicked: "clicked",
  unsubscribed: "unsubscribed",
  bounced: "bounced",
};

describe("mapSendGridStats", () => {
  it("maps numeric and string values for all field combinations", () => {
    const expected = {
      delivered: 1,
      opened: 1,
      clicked: 1,
      unsubscribed: 1,
      bounced: 1,
    } as const;

    const total = 1 << sgFields.length;
    for (let mask = 0; mask < total; mask++) {
      const raw: Record<string, string | number> = {};
      sgFields.forEach((field, idx) => {
        raw[field] = mask & (1 << idx) ? "1" : 1;
      });
      expect(stats.mapSendGridStats(raw)).toEqual(expected);
    }
  });

  it("maps alternate field names with numeric and string values", () => {
    const expected = {
      delivered: 1,
      opened: 1,
      clicked: 1,
      unsubscribed: 1,
      bounced: 1,
    } as const;

    const total = 1 << sgFields.length;
    for (let mask = 0; mask < total; mask++) {
      const raw: Record<string, string | number> = {};
      sgFields.forEach((field, idx) => {
        raw[sgAlt[field]] = mask & (1 << idx) ? "1" : 1;
      });
      expect(stats.mapSendGridStats(raw)).toEqual(expected);
    }
  });

  it("defaults missing fields to zero", () => {
    const base: Record<string, string> = {
      delivered: "1",
      opens: "1",
      clicks: "1",
      unsubscribes: "1",
      bounces: "1",
    };

    sgFields.forEach((field) => {
      const raw = { ...base } as Record<string, string>;
      delete raw[field];
      const expected = {
        delivered: 1,
        opened: 1,
        clicked: 1,
        unsubscribed: 1,
        bounced: 1,
      } as Record<keyof stats.CampaignStats, number>;
      expected[sgResultKey[field]] = 0;
      expect(stats.mapSendGridStats(raw)).toEqual(expected);
    });

    expect(stats.mapSendGridStats({})).toEqual(stats.emptyStats);
  });

  it("coerces non-numeric values to zero", () => {
    const raw = {
      delivered: "not-a-number",
      opens: "1",
      clicks: "NaN",
    } as Record<string, string>;
    expect(stats.mapSendGridStats(raw)).toEqual({
      delivered: 0,
      opened: 1,
      clicked: 0,
      unsubscribed: 0,
      bounced: 0,
    });
  });
});

describe("mapResendStats", () => {
  it("maps numeric and string values for base field names", () => {
    const expected = {
      delivered: 1,
      opened: 1,
      clicked: 1,
      unsubscribed: 1,
      bounced: 1,
    } as const;

    const total = 1 << reFields.length;
    for (let mask = 0; mask < total; mask++) {
      const raw: Record<string, string | number> = {};
      reFields.forEach((field, idx) => {
        raw[field] = mask & (1 << idx) ? "1" : 1;
      });
      expect(stats.mapResendStats(raw)).toEqual(expected);
    }
  });

  it("maps numeric and string values for *_count fields", () => {
    const expected = {
      delivered: 1,
      opened: 1,
      clicked: 1,
      unsubscribed: 1,
      bounced: 1,
    } as const;

    const total = 1 << reFields.length;
    for (let mask = 0; mask < total; mask++) {
      const raw: Record<string, string | number> = {};
      reFields.forEach((field, idx) => {
        raw[reCount[field]] = mask & (1 << idx) ? "1" : 1;
      });
      expect(stats.mapResendStats(raw)).toEqual(expected);
    }
  });

  it("defaults missing fields to zero", () => {
    const base: Record<string, string> = {
      delivered: "1",
      opened: "1",
      clicked: "1",
      unsubscribed: "1",
      bounced: "1",
    };

    reFields.forEach((field) => {
      const raw = { ...base } as Record<string, string>;
      delete raw[field];
      const expected = {
        delivered: 1,
        opened: 1,
        clicked: 1,
        unsubscribed: 1,
        bounced: 1,
      } as Record<keyof stats.CampaignStats, number>;
      expected[reResultKey[field]] = 0;
      expect(stats.mapResendStats(raw)).toEqual(expected);
    });

    expect(stats.mapResendStats({})).toEqual(stats.emptyStats);
  });

  it("coerces non-numeric values to zero", () => {
    const raw = {
      delivered: "oops",
      opened_count: "3",
      clicked: "NaN",
    } as Record<string, string>;
    expect(stats.mapResendStats(raw)).toEqual({
      delivered: 0,
      opened: 3,
      clicked: 0,
      unsubscribed: 0,
      bounced: 0,
    });
  });
});

describe("normalizeProviderStats", () => {
  it("uses sendgrid mapper for sendgrid provider", () => {
    const raw = { delivered: "1" };
    expect(stats.normalizeProviderStats("sendgrid", raw)).toEqual(
      stats.mapSendGridStats(raw)
    );
  });

  it("uses resend mapper for resend provider", () => {
    const raw = { delivered_count: "1" };
    expect(stats.normalizeProviderStats("resend", raw)).toEqual(
      stats.mapResendStats(raw)
    );
  });

  it("returns empty stats for sendgrid provider when stats undefined", () => {
    const result = stats.normalizeProviderStats("sendgrid", undefined);
    expect(result).toEqual(stats.emptyStats);
    expect(result).not.toBe(stats.emptyStats);
  });

  it("returns empty stats for resend provider when stats undefined", () => {
    const result = stats.normalizeProviderStats("resend", undefined);
    expect(result).toEqual(stats.emptyStats);
    expect(result).not.toBe(stats.emptyStats);
  });

  it("returns empty stats for unknown provider", () => {
    const result = stats.normalizeProviderStats("unknown", { delivered: "1" });
    expect(result).toEqual(stats.emptyStats);
    expect(result).not.toBe(stats.emptyStats);
  });
});
