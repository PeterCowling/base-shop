import { describe, expect, it } from "@jest/globals";

import { detectMissingArtifacts } from "../ideas/lp-do-ideas-queue-audit.js";

describe("detectMissingArtifacts", () => {
  it("TC-01 returns empty when all fact_find_path artifacts exist", () => {
    const readFileSyncFn = jest.fn().mockReturnValue(
      JSON.stringify({
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260101-0001",
            queue_state: "processed",
            processed_by: {
              route: "dispatch-routed",
              processed_at: "2026-01-01T00:00:00.000Z",
              queue_state: "processed",
              fact_find_slug: "some-slug-1",
              fact_find_path: "docs/plans/some-slug-1/fact-find.md",
            },
          },
          {
            dispatch_id: "IDEA-DISPATCH-20260101-0002",
            queue_state: "processed",
            processed_by: {
              route: "dispatch-routed",
              processed_at: "2026-01-01T00:00:00.000Z",
              queue_state: "processed",
              fact_find_slug: "some-slug-2",
              fact_find_path: "docs/plans/some-slug-2/fact-find.md",
            },
          },
        ],
      }),
    );
    const mockExistsSync = jest.fn().mockReturnValue(true);

    const result = detectMissingArtifacts({
      queueStatePath: "/fake/queue-state.json",
      basedir: "/repo",
      existsSync: mockExistsSync,
      readFileSyncFn,
    });

    expect(result).toEqual([]);
    expect(readFileSyncFn).toHaveBeenCalledWith("/fake/queue-state.json", "utf-8");
    expect(mockExistsSync).toHaveBeenCalledTimes(2);
  });

  it("TC-02 returns only missing entries when some fact_find_path artifacts are missing", () => {
    const readFileSyncFn = jest.fn().mockReturnValue(
      JSON.stringify({
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260101-0001",
            queue_state: "processed",
            processed_by: {
              route: "dispatch-routed",
              processed_at: "2026-01-01T00:00:00.000Z",
              queue_state: "processed",
              fact_find_slug: "slug-1",
              fact_find_path: "docs/plans/slug-1/fact-find.md",
            },
          },
          {
            dispatch_id: "IDEA-DISPATCH-20260101-0002",
            queue_state: "processed",
            processed_by: {
              route: "dispatch-routed",
              processed_at: "2026-01-01T00:00:00.000Z",
              queue_state: "processed",
              fact_find_slug: "slug-2",
              fact_find_path: "docs/plans/slug-2/fact-find.md",
            },
          },
          {
            dispatch_id: "IDEA-DISPATCH-20260101-0003",
            queue_state: "processed",
            processed_by: {
              route: "dispatch-routed",
              processed_at: "2026-01-01T00:00:00.000Z",
              queue_state: "processed",
              fact_find_slug: "slug-3",
              fact_find_path: "docs/plans/slug-3/fact-find.md",
            },
          },
          {
            dispatch_id: "IDEA-DISPATCH-20260101-0004",
            queue_state: "processed",
            processed_by: {
              route: "dispatch-routed",
              processed_at: "2026-01-01T00:00:00.000Z",
              queue_state: "processed",
              fact_find_slug: "slug-4",
              fact_find_path: "docs/plans/slug-4/fact-find.md",
            },
          },
        ],
      }),
    );

    const missingPaths = new Set([
      "/repo/docs/plans/slug-2/fact-find.md",
      "/repo/docs/plans/slug-4/fact-find.md",
    ]);
    const mockExistsSync = jest
      .fn()
      .mockImplementation((path: string) => !missingPaths.has(path));

    const result = detectMissingArtifacts({
      queueStatePath: "/fake/queue-state.json",
      basedir: "/repo",
      existsSync: mockExistsSync,
      readFileSyncFn,
    });

    expect(result).toEqual([
      {
        dispatch_id: "IDEA-DISPATCH-20260101-0002",
        fact_find_path: "docs/plans/slug-2/fact-find.md",
        queue_state: "processed",
      },
      {
        dispatch_id: "IDEA-DISPATCH-20260101-0004",
        fact_find_path: "docs/plans/slug-4/fact-find.md",
        queue_state: "processed",
      },
    ]);
  });

  it("TC-03 ignores dispatches without processed_by", () => {
    const readFileSyncFn = jest.fn().mockReturnValue(
      JSON.stringify({
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260101-0001",
            queue_state: "processed",
          },
          {
            dispatch_id: "IDEA-DISPATCH-20260101-0002",
            queue_state: "processed",
            processed_by: null,
          },
        ],
      }),
    );
    const mockExistsSync = jest.fn().mockReturnValue(false);

    const result = detectMissingArtifacts({
      queueStatePath: "/fake/queue-state.json",
      basedir: "/repo",
      existsSync: mockExistsSync,
      readFileSyncFn,
    });

    expect(result).toEqual([]);
    expect(mockExistsSync).not.toHaveBeenCalled();
  });

  it("TC-04 ignores processed_by entries that do not include fact_find_path", () => {
    const readFileSyncFn = jest.fn().mockReturnValue(
      JSON.stringify({
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260101-0002",
            queue_state: "auto_executed",
            processed_by: {
              route: "auto_executed",
              processed_at: "2026-01-01T00:00:00.000Z",
            },
          },
        ],
      }),
    );
    const mockExistsSync = jest.fn().mockReturnValue(false);

    const result = detectMissingArtifacts({
      queueStatePath: "/fake/queue-state.json",
      basedir: "/repo",
      existsSync: mockExistsSync,
      readFileSyncFn,
    });

    expect(result).toEqual([]);
    expect(mockExistsSync).not.toHaveBeenCalled();
  });

  it("TC-05 throws when queue-state file cannot be read", () => {
    const readFileSyncFn = jest.fn(() => {
      throw new Error("ENOENT: no such file");
    });
    const mockExistsSync = jest.fn().mockReturnValue(true);

    expect(() =>
      detectMissingArtifacts({
        queueStatePath: "/nope.json",
        basedir: "/repo",
        existsSync: mockExistsSync,
        readFileSyncFn,
      }),
    ).toThrow('Failed to read queue-state.json at "/nope.json": ENOENT: no such file');
  });
});
