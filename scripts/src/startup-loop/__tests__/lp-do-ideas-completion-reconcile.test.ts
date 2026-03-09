import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { runIdeaCompletionReconcile } from "../ideas/lp-do-ideas-completion-reconcile.js";

async function writeFile(root: string, relativePath: string, content: string): Promise<void> {
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf8");
}

async function writeJson(root: string, relativePath: string, value: unknown): Promise<void> {
  await writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe("lp-do-ideas-completion-reconcile", () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ideas-completion-reconcile-"));
    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );
    await writeJson(
      repoRoot,
      "docs/business-os/_data/completed-ideas.json",
      {
        schema_version: "completed-ideas.v1",
        entries: [],
      },
    );
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("closes queue items linked by explicit dispatch ID to an archived plan with build record", async () => {
    await writeFile(
      repoRoot,
      "docs/plans/_archive/example-feature/fact-find.md",
      `---
Feature-Slug: example-feature
Dispatch-ID: IDEA-DISPATCH-20260309-0001
---
`,
    );
    await writeFile(
      repoRoot,
      "docs/plans/_archive/example-feature/plan.md",
      `---
Status: Archived
Feature-Slug: example-feature
---
`,
    );
    await writeFile(
      repoRoot,
      "docs/plans/_archive/example-feature/build-record.user.md",
      `## What Was Built

Implemented the archived feature.
`,
    );
    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260309-0001",
            business: "BOS",
            status: "fact_find_ready",
            queue_state: "enqueued",
            area_anchor: "example feature",
            self_evolving: {
              candidate_id: "cand-1",
              decision_id: "decision-1",
              policy_version: "self-evolving-policy.v1",
              recommended_route_origin: "lp-do-fact-find",
              executor_path: "lp-do-build:container:website-v3",
              handoff_emitted_at: "2026-03-09T01:00:00.000Z",
            },
            created_at: "2026-03-09T01:00:00.000Z",
          },
        ],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );

    const result = runIdeaCompletionReconcile({
      rootDir: repoRoot,
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      write: true,
    });

    expect(result.ok).toBe(true);
    expect(result.queue_dispatches_completed).toBe(1);
    expect(result.completed_registry_added).toBe(1);

    const queue = JSON.parse(
      await fs.readFile(
        path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/queue-state.json"),
        "utf8",
      ),
    ) as { dispatches: Array<Record<string, unknown>> };
    expect(queue.dispatches[0]?.queue_state).toBe("completed");
    expect((queue.dispatches[0]?.completed_by as { plan_path?: string }).plan_path).toBe(
      "docs/plans/_archive/example-feature/plan.md",
    );
    expect(
      (
        queue.dispatches[0]?.completed_by as {
          self_evolving?: { candidate_id?: string; decision_id?: string };
        }
      ).self_evolving,
    ).toEqual(
      expect.objectContaining({
        candidate_id: "cand-1",
        decision_id: "decision-1",
      }),
    );

    const registry = JSON.parse(
      await fs.readFile(path.join(repoRoot, "docs/business-os/_data/completed-ideas.json"), "utf8"),
    ) as { entries: Array<Record<string, unknown>> };
    expect(registry.entries[0]?.title).toBe("IDEA-DISPATCH-20260309-0001");
    expect(registry.entries[0]?.plan_slug).toBe("example-feature");
  });

  it("closes queue items linked by processed_by micro_build_path to a completed micro-build", async () => {
    await writeFile(
      repoRoot,
      "docs/plans/example-micro/micro-build.md",
      `---
Status: Complete
Feature-Slug: example-micro
Dispatch-ID: IDEA-DISPATCH-20260309-0002
---
`,
    );
    await writeFile(
      repoRoot,
      "docs/plans/example-micro/build-record.user.md",
      `## What Was Built

Extracted the shared RadioStep component.
`,
    );
    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260309-0002",
            business: "BOS",
            status: "micro_build_ready",
            queue_state: "enqueued",
            area_anchor: "example micro build",
            processed_by: {
              target_route: "lp-do-build",
              micro_build_path: "docs/plans/example-micro/micro-build.md",
            },
            created_at: "2026-03-09T01:00:00.000Z",
          },
        ],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );

    const result = runIdeaCompletionReconcile({
      rootDir: repoRoot,
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      write: true,
    });

    expect(result.ok).toBe(true);
    expect(result.queue_dispatches_completed).toBe(1);

    const queue = JSON.parse(
      await fs.readFile(
        path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/queue-state.json"),
        "utf8",
      ),
    ) as { dispatches: Array<Record<string, unknown>> };
    expect(queue.dispatches[0]?.queue_state).toBe("completed");
    expect(
      (queue.dispatches[0]?.completed_by as { micro_build_path?: string }).micro_build_path,
    ).toBe("docs/plans/example-micro/micro-build.md");
  });

  it("leaves dispatches open when the linked plan lacks canonical build evidence", async () => {
    await writeFile(
      repoRoot,
      "docs/plans/example-incomplete/fact-find.md",
      `---
Feature-Slug: example-incomplete
Dispatch-ID: IDEA-DISPATCH-20260309-0003
---
`,
    );
    await writeFile(
      repoRoot,
      "docs/plans/example-incomplete/plan.md",
      `---
Status: Complete
Feature-Slug: example-incomplete
---
`,
    );
    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260309-0003",
            business: "BOS",
            status: "fact_find_ready",
            queue_state: "enqueued",
            area_anchor: "missing build evidence",
            created_at: "2026-03-09T01:00:00.000Z",
          },
        ],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );

    const result = runIdeaCompletionReconcile({
      rootDir: repoRoot,
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      write: true,
    });

    expect(result.ok).toBe(true);
    expect(result.queue_dispatches_completed).toBe(0);
    expect(result.completed_registry_added).toBe(0);

    const queue = JSON.parse(
      await fs.readFile(
        path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/queue-state.json"),
        "utf8",
      ),
    ) as { dispatches: Array<Record<string, unknown>> };
    expect(queue.dispatches[0]?.queue_state).toBe("enqueued");
  });

  it("backfills completed-registry entries for packets already marked completed via completed_by plan_path", async () => {
    await writeFile(
      repoRoot,
      "docs/plans/example-complete/plan.md",
      `---
Status: Complete
Feature-Slug: example-complete
---
`,
    );
    await writeFile(
      repoRoot,
      "docs/plans/example-complete/build-record.user.md",
      `## What Was Built

Implemented the completed feature.
`,
    );
    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260309-0004",
            business: "BOS",
            status: "completed",
            queue_state: "completed",
            area_anchor: "already complete",
            completed_by: {
              plan_path: "docs/plans/example-complete/plan.md",
              completed_at: "2026-03-09T02:00:00.000Z",
              outcome: "Implemented the completed feature.",
            },
            created_at: "2026-03-09T01:00:00.000Z",
          },
        ],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );

    const result = runIdeaCompletionReconcile({
      rootDir: repoRoot,
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      write: true,
    });

    expect(result.ok).toBe(true);
    expect(result.queue_dispatches_completed).toBe(0);
    expect(result.completed_registry_added).toBe(1);
    expect(result.already_completed_matches).toBe(1);

    const queue = JSON.parse(
      await fs.readFile(
        path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/queue-state.json"),
        "utf8",
      ),
    ) as { dispatches: Array<Record<string, unknown>> };
    expect((queue.dispatches[0]?.processed_by as { target_slug?: string }).target_slug).toBe(
      "example-complete",
    );

    const registry = JSON.parse(
      await fs.readFile(path.join(repoRoot, "docs/business-os/_data/completed-ideas.json"), "utf8"),
    ) as { entries: Array<Record<string, unknown>> };
    expect(registry.entries[0]?.title).toBe("IDEA-DISPATCH-20260309-0004");
    expect(registry.entries[0]?.output_link).toBe("docs/plans/example-complete/plan.md");
  });

  it("does not crash when completed_by plan_path points at a directory", async () => {
    await writeFile(
      repoRoot,
      "docs/plans/example-complete/plan.md",
      `---
Status: Complete
Feature-Slug: example-complete
---
`,
    );
    await writeFile(
      repoRoot,
      "docs/plans/example-complete/build-record.user.md",
      `## What Was Built

Implemented the completed feature.
`,
    );
    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260309-0004B",
            business: "BOS",
            status: "completed",
            queue_state: "completed",
            area_anchor: "already complete",
            processed_by: {
              target_slug: "example-complete",
            },
            completed_by: {
              plan_path: "docs/plans/example-complete/",
              completed_at: "2026-03-09T02:00:00.000Z",
              outcome: "Implemented the completed feature.",
            },
            created_at: "2026-03-09T01:00:00.000Z",
          },
        ],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );

    const result = runIdeaCompletionReconcile({
      rootDir: repoRoot,
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      write: true,
    });

    expect(result.ok).toBe(true);
    expect(result.completed_registry_added).toBe(1);

    const registry = JSON.parse(
      await fs.readFile(path.join(repoRoot, "docs/business-os/_data/completed-ideas.json"), "utf8"),
    ) as { entries: Array<Record<string, unknown>> };
    expect(registry.entries[0]?.title).toBe("IDEA-DISPATCH-20260309-0004B");
  });

  it("backfills completed-registry entries for legacy direct completions without a plan path", async () => {
    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260309-0005",
            business: "PWRB",
            anchor_key: "brand-name-selection",
            status: "fact_find_ready",
            queue_state: "completed",
            area_anchor: "brand name selected",
            completed_at: "2026-03-09T03:00:00.000Z",
            outcome: "operator-decision: brand selected",
            created_at: "2026-03-09T01:00:00.000Z",
          },
        ],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );

    const result = runIdeaCompletionReconcile({
      rootDir: repoRoot,
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      write: true,
    });

    expect(result.ok).toBe(true);
    expect(result.queue_dispatches_completed).toBe(0);
    expect(result.completed_registry_added).toBe(1);
    expect(result.already_completed_matches).toBe(1);

    const registry = JSON.parse(
      await fs.readFile(path.join(repoRoot, "docs/business-os/_data/completed-ideas.json"), "utf8"),
    ) as { entries: Array<Record<string, unknown>> };
    expect(registry.entries[0]?.title).toBe("IDEA-DISPATCH-20260309-0005");
    expect(registry.entries[0]?.plan_slug).toBe("brand-name-selection");
    expect(registry.entries[0]?.output_link).toBeUndefined();
  });

  it("prunes malformed queue-sourced completed entries that alias still-open dispatch titles", async () => {
    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [
          {
            dispatch_id: "IDEA-DISPATCH-20260309-0006",
            business: "BRIK",
            status: "fact_find_ready",
            queue_state: "enqueued",
            area_anchor: "email pipeline alias still open",
            created_at: "2026-03-09T01:00:00.000Z",
          },
        ],
        counts: {},
        last_updated: "2026-03-09T00:00:00.000Z",
      },
    );
    await writeJson(
      repoRoot,
      "docs/business-os/_data/completed-ideas.json",
      {
        schema_version: "completed-ideas.v1",
        entries: [
          {
            idea_key: "stale-key",
            title: "email pipeline alias still open",
            source_path: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
            plan_slug: "email-pipeline-simulation-hardening",
            completed_at: "2026-03-09",
            output_link: "docs/plans/_archive/email-pipeline-simulation-hardening/",
          },
        ],
      },
    );

    const result = runIdeaCompletionReconcile({
      rootDir: repoRoot,
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      completedIdeasPath: "docs/business-os/_data/completed-ideas.json",
      write: true,
    });

    expect(result.ok).toBe(true);

    const registry = JSON.parse(
      await fs.readFile(path.join(repoRoot, "docs/business-os/_data/completed-ideas.json"), "utf8"),
    ) as { entries: Array<Record<string, unknown>> };
    expect(registry.entries).toHaveLength(0);
  });
});
