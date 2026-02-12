import { describe, expect, it } from "@jest/globals";

import {
  summarizeJobDurations,
  summarizeWorkflowRuns,
  type WorkflowJobRecord,
  type WorkflowRunRecord,
} from "../../src/ci/collect-workflow-metrics";

describe("summarizeWorkflowRuns", () => {
  it("TC-01: counts mixed conclusions correctly", () => {
    const runs: WorkflowRunRecord[] = [
      {
        databaseId: 1,
        headBranch: "staging",
        event: "push",
        status: "completed",
        conclusion: "success",
        createdAt: "2026-02-07T00:00:00Z",
        updatedAt: "2026-02-07T00:10:00Z",
      },
      {
        databaseId: 2,
        headBranch: "staging",
        event: "push",
        status: "completed",
        conclusion: "failure",
        createdAt: "2026-02-07T01:00:00Z",
        updatedAt: "2026-02-07T01:20:00Z",
      },
      {
        databaseId: 3,
        headBranch: "staging",
        event: "push",
        status: "completed",
        conclusion: "cancelled",
        createdAt: "2026-02-07T02:00:00Z",
        updatedAt: "2026-02-07T02:05:00Z",
      },
      {
        databaseId: 4,
        headBranch: "staging",
        event: "push",
        status: "in_progress",
        conclusion: null,
        createdAt: "2026-02-07T03:00:00Z",
        updatedAt: "2026-02-07T03:01:00Z",
      },
      {
        databaseId: 5,
        headBranch: "staging",
        event: "push",
        status: "in_progress",
        conclusion: "",
        createdAt: "2026-02-07T04:00:00Z",
        updatedAt: "2026-02-07T04:01:00Z",
      },
    ];

    const summary = summarizeWorkflowRuns(runs);

    expect(summary.total).toBe(5);
    expect(summary.outcomes).toEqual({
      success: 1,
      failure: 1,
      cancelled: 1,
      null: 2,
    });
  });

  it("TC-02: computes completed and success-only duration stats", () => {
    const runs: WorkflowRunRecord[] = [
      {
        databaseId: 1,
        status: "completed",
        conclusion: "success",
        createdAt: "2026-02-07T00:00:00Z",
        updatedAt: "2026-02-07T00:10:00Z",
      },
      {
        databaseId: 2,
        status: "completed",
        conclusion: "failure",
        createdAt: "2026-02-07T01:00:00Z",
        updatedAt: "2026-02-07T01:20:00Z",
      },
      {
        databaseId: 3,
        status: "completed",
        conclusion: "cancelled",
        createdAt: "2026-02-07T02:00:00Z",
        updatedAt: "2026-02-07T02:05:00Z",
      },
    ];

    const summary = summarizeWorkflowRuns(runs);

    expect(summary.durations.completed.count).toBe(3);
    expect(summary.durations.completed.p50).toBeCloseTo(10, 5);
    expect(summary.durations.completed.p90).toBeCloseTo(18, 5);
    expect(summary.durations.completed.avg).toBeCloseTo(11.6666667, 5);

    expect(summary.durations.success.count).toBe(1);
    expect(summary.durations.success.p50).toBeCloseTo(10, 5);
    expect(summary.durations.success.p90).toBeCloseTo(10, 5);
    expect(summary.durations.success.avg).toBeCloseTo(10, 5);
  });

  it("TC-03: applies branch and event filters", () => {
    const runs: WorkflowRunRecord[] = [
      {
        databaseId: 1,
        headBranch: "staging",
        event: "push",
        status: "completed",
        conclusion: "success",
        createdAt: "2026-02-07T00:00:00Z",
        updatedAt: "2026-02-07T00:10:00Z",
      },
      {
        databaseId: 2,
        headBranch: "main",
        event: "push",
        status: "completed",
        conclusion: "failure",
        createdAt: "2026-02-07T01:00:00Z",
        updatedAt: "2026-02-07T01:20:00Z",
      },
      {
        databaseId: 3,
        headBranch: "staging",
        event: "pull_request",
        status: "completed",
        conclusion: "cancelled",
        createdAt: "2026-02-07T02:00:00Z",
        updatedAt: "2026-02-07T02:05:00Z",
      },
    ];

    const summary = summarizeWorkflowRuns(runs, {
      branch: "staging",
      event: "push",
    });

    expect(summary.total).toBe(1);
    expect(summary.outcomes).toEqual({ success: 1 });
  });

  it("TC-04: handles empty input safely", () => {
    const summary = summarizeWorkflowRuns([]);

    expect(summary.total).toBe(0);
    expect(summary.outcomes).toEqual({});
    expect(summary.durations.completed.count).toBe(0);
    expect(summary.durations.completed.p50).toBeNull();
    expect(summary.durations.completed.p90).toBeNull();
    expect(summary.durations.completed.avg).toBeNull();
  });
});

describe("summarizeJobDurations", () => {
  it("TC-05: reports per-job duration breakdown", () => {
    const jobs: WorkflowJobRecord[] = [
      {
        name: "Build",
        conclusion: "success",
        startedAt: "2026-02-07T00:00:00Z",
        completedAt: "2026-02-07T00:05:00Z",
      },
      {
        name: "Build",
        conclusion: "failure",
        startedAt: "2026-02-07T01:00:00Z",
        completedAt: "2026-02-07T01:07:00Z",
      },
      {
        name: "Deploy",
        conclusion: "success",
        startedAt: "2026-02-07T02:00:00Z",
        completedAt: "2026-02-07T02:02:00Z",
      },
    ];

    const summary = summarizeJobDurations(jobs);

    expect(summary).toHaveLength(2);

    const build = summary.find((entry) => entry.name === "Build");
    const deploy = summary.find((entry) => entry.name === "Deploy");

    expect(build).toBeDefined();
    expect(deploy).toBeDefined();

    expect(build).toMatchObject({
      count: 2,
      outcomes: {
        success: 1,
        failure: 1,
      },
    });
    expect(build?.durations.p50).toBeCloseTo(6, 5);
    expect(build?.durations.p90).toBeCloseTo(6.8, 5);

    expect(deploy).toMatchObject({
      count: 1,
      outcomes: {
        success: 1,
      },
    });
    expect(deploy?.durations.p50).toBeCloseTo(2, 5);
  });
});
