/* eslint-disable import/first */
jest.mock("server-only", () => ({}));
jest.mock("../db.server", () => ({
  getInboxDb: jest.fn(),
}));

import type { D1Database } from "@acme/platform-core/d1";

import {
  computeAdmissionMetrics,
  computeAnalytics,
  computeQualityMetrics,
  computeResolutionMetrics,
  computeVolumeMetrics,
} from "../analytics.server";

// ---------------------------------------------------------------------------
// D1 mock helpers
// ---------------------------------------------------------------------------

type PreparedResult = {
  bind: jest.Mock;
  run: jest.Mock;
  first: jest.Mock;
  all: jest.Mock;
};

function createMockDb(): D1Database & { _preparedResults: PreparedResult[] } {
  const preparedResults: PreparedResult[] = [];

  const prepare = jest.fn(() => {
    const stmt: PreparedResult = {
      bind: jest.fn().mockReturnThis(),
      run: jest.fn(),
      first: jest.fn().mockResolvedValue(null),
      all: jest.fn().mockResolvedValue({ results: [] }),
    };
    preparedResults.push(stmt);
    return stmt;
  });

  return {
    prepare,
    batch: jest.fn(),
    exec: jest.fn(),
    dump: jest.fn(),
    _preparedResults: preparedResults,
  } as unknown as D1Database & { _preparedResults: PreparedResult[] };
}

// ---------------------------------------------------------------------------
// computeVolumeMetrics
// ---------------------------------------------------------------------------

describe("computeVolumeMetrics", () => {
  it("returns correct counts per event type", async () => {
    const db = createMockDb();
    // The volume query uses .all() to get event_type counts
    db.prepare = jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      run: jest.fn(),
      first: jest.fn(),
      all: jest.fn().mockResolvedValue({
        results: [
          { event_type: "admitted", thread_count: 10 },
          { event_type: "drafted", thread_count: 8 },
          { event_type: "sent", thread_count: 6 },
          { event_type: "resolved", thread_count: 4 },
        ],
      }),
    })) as unknown as D1Database["prepare"];

    const result = await computeVolumeMetrics({ db });

    expect(result.admitted).toBe(10);
    expect(result.drafted).toBe(8);
    expect(result.sent).toBe(6);
    expect(result.resolved).toBe(4);
    expect(result.totalThreads).toBe(10); // admitted + 0 auto_archived + 0 review_later
  });

  it("returns all zeros when no events exist", async () => {
    const db = createMockDb();
    db.prepare = jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      run: jest.fn(),
      first: jest.fn(),
      all: jest.fn().mockResolvedValue({ results: [] }),
    })) as unknown as D1Database["prepare"];

    const result = await computeVolumeMetrics({ db });

    expect(result.totalThreads).toBe(0);
    expect(result.admitted).toBe(0);
    expect(result.drafted).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.resolved).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeQualityMetrics
// ---------------------------------------------------------------------------

describe("computeQualityMetrics", () => {
  it("returns correct pass/fail counts and pass rate", async () => {
    const db = createMockDb();
    let callIndex = 0;
    db.prepare = jest.fn(() => {
      callIndex++;
      // 1st call: total drafted count
      if (callIndex === 1) {
        return {
          bind: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({ total: 10 }),
          all: jest.fn(),
        };
      }
      // 2nd call: quality outcome counts
      if (callIndex === 2) {
        return {
          bind: jest.fn().mockReturnThis(),
          first: jest.fn(),
          all: jest.fn().mockResolvedValue({
            results: [
              { quality_outcome: "passed", count: 7 },
              { quality_outcome: "failed", count: 3 },
            ],
          }),
        };
      }
      // 3rd call: failure reasons
      return {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn(),
        all: jest.fn().mockResolvedValue({
          results: [
            { reason: "unanswered_questions", count: 2 },
            { reason: "missing_signature", count: 1 },
          ],
        }),
      };
    }) as unknown as D1Database["prepare"];

    const result = await computeQualityMetrics({ db });

    expect(result.totalDrafted).toBe(10);
    expect(result.qualityPassed).toBe(7);
    expect(result.qualityFailed).toBe(3);
    expect(result.passRate).toBe(70);
    expect(result.topFailureReasons).toEqual([
      { reason: "unanswered_questions", count: 2 },
      { reason: "missing_signature", count: 1 },
    ]);
  });

  it("returns null pass rate when no drafted events exist", async () => {
    const db = createMockDb();
    db.prepare = jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ total: 0 }),
      all: jest.fn().mockResolvedValue({ results: [] }),
    })) as unknown as D1Database["prepare"];

    const result = await computeQualityMetrics({ db });

    expect(result.totalDrafted).toBe(0);
    expect(result.qualityPassed).toBe(0);
    expect(result.qualityFailed).toBe(0);
    expect(result.passRate).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeResolutionMetrics
// ---------------------------------------------------------------------------

describe("computeResolutionMetrics", () => {
  it("returns correct average hours", async () => {
    const db = createMockDb();
    db.prepare = jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({
        resolved_count: 5,
        avg_hours_to_sent: 2.35,
        avg_hours_to_resolved: 4.78,
      }),
      all: jest.fn(),
    })) as unknown as D1Database["prepare"];

    const result = await computeResolutionMetrics({ db });

    expect(result.resolvedCount).toBe(5);
    expect(result.avgAdmittedToSentHours).toBe(2.4); // rounded to 1 decimal
    expect(result.avgAdmittedToResolvedHours).toBe(4.8);
  });

  it("returns null averages when no resolved threads exist", async () => {
    const db = createMockDb();
    db.prepare = jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({
        resolved_count: 0,
        avg_hours_to_sent: null,
        avg_hours_to_resolved: null,
      }),
      all: jest.fn(),
    })) as unknown as D1Database["prepare"];

    const result = await computeResolutionMetrics({ db });

    expect(result.resolvedCount).toBe(0);
    expect(result.avgAdmittedToSentHours).toBeNull();
    expect(result.avgAdmittedToResolvedHours).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeAdmissionMetrics
// ---------------------------------------------------------------------------

describe("computeAdmissionMetrics", () => {
  it("returns correct admission rates", async () => {
    const db = createMockDb();
    db.prepare = jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      first: jest.fn(),
      all: jest.fn().mockResolvedValue({
        results: [
          { decision: "admit", count: 8 },
          { decision: "auto-archive", count: 5 },
          { decision: "review-later", count: 2 },
        ],
      }),
    })) as unknown as D1Database["prepare"];

    const result = await computeAdmissionMetrics({ db });

    expect(result.totalProcessed).toBe(15);
    expect(result.admitted).toBe(8);
    expect(result.admittedRate).toBe(53.3);
    expect(result.autoArchived).toBe(5);
    expect(result.autoArchivedRate).toBe(33.3);
    expect(result.reviewLater).toBe(2);
    expect(result.reviewLaterRate).toBe(13.3);
  });

  it("returns zeros and null rates when no outcomes exist", async () => {
    const db = createMockDb();
    db.prepare = jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      first: jest.fn(),
      all: jest.fn().mockResolvedValue({ results: [] }),
    })) as unknown as D1Database["prepare"];

    const result = await computeAdmissionMetrics({ db });

    expect(result.totalProcessed).toBe(0);
    expect(result.admitted).toBe(0);
    expect(result.admittedRate).toBeNull();
    expect(result.autoArchived).toBe(0);
    expect(result.autoArchivedRate).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeAnalytics (selective)
// ---------------------------------------------------------------------------

describe("computeAnalytics", () => {
  it("returns only requested metric groups", async () => {
    const db = createMockDb();
    // volume query
    db.prepare = jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      all: jest.fn().mockResolvedValue({ results: [] }),
    })) as unknown as D1Database["prepare"];

    const result = await computeAnalytics({ db, metrics: ["volume"] });

    expect(result.volume).toBeDefined();
    expect(result.quality).toBeUndefined();
    expect(result.resolution).toBeUndefined();
    expect(result.admission).toBeUndefined();
    expect(result.period).toEqual({ days: null });
  });

  it("includes days in period when provided", async () => {
    const db = createMockDb();
    db.prepare = jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      all: jest.fn().mockResolvedValue({ results: [] }),
    })) as unknown as D1Database["prepare"];

    const result = await computeAnalytics({ db, days: 7, metrics: ["volume"] });

    expect(result.period).toEqual({ days: 7 });
  });
});
