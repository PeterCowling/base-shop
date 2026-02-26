import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  appendCompletedIdea,
  collectProcessImprovements,
  deriveIdeaKey,
  loadCompletedIdeasRegistry,
  runCheck,
  updateProcessImprovementsHtml,
} from "../generate-process-improvements";

async function writeFile(root: string, relativePath: string, content: string): Promise<void> {
  const absPath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, content, "utf8");
}

describe("generate-process-improvements", () => {
  it("collects idea candidates, reflection risks, and pending reviews from plan artifacts", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "process-improvements-"));

    await writeFile(
      repoRoot,
      "docs/plans/feature-a/build-record.user.md",
      `---
Business-Unit: BRIK
---
# Build Record`,
    );
    await writeFile(
      repoRoot,
      "docs/plans/feature-a/results-review.user.md",
      `---
Business-Unit: BRIK
Review-date: 2026-02-25
---
# Results Review

## Observed Outcomes
- Outcome observed.

## Standing Updates
- No standing updates: reason.

## New Idea Candidates
- Add ranking layer | Trigger observation: 1 seed rejected in pilot | Suggested next action: create INVESTIGATE task

## Standing Expansion
- No standing expansion: reason.
`,
    );

    await writeFile(
      repoRoot,
      "docs/plans/feature-b/build-record.user.md",
      `---
Business-Unit: HBAG
Feature-Slug: feature-b
---
# Build Record`,
    );

    await writeFile(
      repoRoot,
      "docs/plans/feature-b/reflection-debt.user.md",
      `# Reflection Debt
<!-- REFLECTION_DEBT_LEDGER_START -->
\`\`\`json
{
  "schema_version": "reflection-debt.v1",
  "feature_slug": "feature-b",
  "generated_at": "2026-02-25T12:00:00.000Z",
  "items": [
    {
      "status": "open",
      "feature_slug": "feature-b",
      "business_scope": "HBAG",
      "due_at": "2026-03-01T00:00:00.000Z",
      "updated_at": "2026-02-25T12:00:00.000Z",
      "minimum_reflection": {
        "missing_sections": ["Observed Outcomes", "Standing Updates"]
      },
      "source_paths": {
        "results_review_path": "/tmp/feature-b/results-review.user.md"
      }
    }
  ]
}
\`\`\`
<!-- REFLECTION_DEBT_LEDGER_END -->
`,
    );

    const data = collectProcessImprovements(repoRoot);

    expect(data.ideaItems).toHaveLength(1);
    expect(data.ideaItems[0]?.business).toBe("BRIK");
    expect(data.ideaItems[0]?.title).toBe("Add ranking layer");
    expect(data.ideaItems[0]?.suggested_action).toBe("create INVESTIGATE task");

    expect(data.riskItems).toHaveLength(1);
    expect(data.riskItems[0]?.business).toBe("HBAG");
    expect(data.riskItems[0]?.title).toContain("feature-b");

    expect(data.pendingReviewItems).toHaveLength(1);
    expect(data.pendingReviewItems[0]?.business).toBe("HBAG");
    expect(data.pendingReviewItems[0]?.title).toContain("feature-b");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("replaces array assignments and footer date in process improvements HTML", async () => {
    const html = `
<div>Last cleared: 2026-01-01 — test</div>
<script>
var IDEA_ITEMS = [];
var RISK_ITEMS = [];
var PENDING_REVIEW_ITEMS = [];
</script>
`;

    const updated = updateProcessImprovementsHtml(
      html,
      {
        ideaItems: [
          {
            type: "idea",
            business: "BRIK",
            title: "Idea",
            body: "Body",
            source: "results-review.user.md",
            date: "2026-02-25",
            path: "docs/plans/x/results-review.user.md",
          },
        ],
        riskItems: [],
        pendingReviewItems: [],
      },
      "2026-02-25",
    );

    expect(updated).toContain('"title": "Idea"');
    expect(updated).toContain("Last cleared: 2026-02-25");
    expect(updated).toContain("var IDEA_ITEMS = [");
    expect(updated).toContain("var RISK_ITEMS = [");
    expect(updated).toContain("var PENDING_REVIEW_ITEMS = [");
  });
});

const HTML_TEMPLATE = `<div>Last cleared: 2026-01-01 — test</div>
<script>
var IDEA_ITEMS = [];
var RISK_ITEMS = [];
var PENDING_REVIEW_ITEMS = [];
</script>
`;

const IDEA_SOURCE_MD = `---
Business-Unit: BRIK
Review-date: 2026-02-25
---
# Results Review

## Observed Outcomes
- Outcome observed.

## Standing Updates
- No standing updates: reason.

## New Idea Candidates
- Add ranking layer | Trigger observation: 1 seed rejected in pilot | Suggested next action: create INVESTIGATE task

## Standing Expansion
- No standing expansion: reason.
`;

describe("runCheck", () => {
  let tmpDir: string;
  let exitSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "run-check-"));
    exitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with ${String(code)}`);
    });
  });

  afterEach(async () => {
    exitSpy.mockRestore();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("TC-13: completes without error when committed output files are up-to-date", async () => {
    await writeFile(tmpDir, "docs/plans/feature-a/results-review.user.md", IDEA_SOURCE_MD);

    const data = collectProcessImprovements(tmpDir);
    const expectedDataJson = `${JSON.stringify(data, null, 2)}\n`;
    const expectedHtml = updateProcessImprovementsHtml(HTML_TEMPLATE, data, "2026-02-25");

    await writeFile(tmpDir, "docs/business-os/process-improvements.user.html", expectedHtml);
    await writeFile(tmpDir, "docs/business-os/_data/process-improvements.json", expectedDataJson);

    expect(() => runCheck(tmpDir)).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("TC-14: calls process.exit(1) when committed HTML has stale array assignments", async () => {
    await writeFile(tmpDir, "docs/plans/feature-a/results-review.user.md", IDEA_SOURCE_MD);

    const data = collectProcessImprovements(tmpDir);
    const expectedDataJson = `${JSON.stringify(data, null, 2)}\n`;

    // Stale HTML — empty arrays, does not reflect the actual idea item
    await writeFile(tmpDir, "docs/business-os/process-improvements.user.html", HTML_TEMPLATE);
    await writeFile(tmpDir, "docs/business-os/_data/process-improvements.json", expectedDataJson);

    expect(() => runCheck(tmpDir)).toThrow("process.exit called with 1");
  });

  it("TC-15: calls process.exit(1) when the committed HTML file does not exist", async () => {
    await writeFile(tmpDir, "docs/plans/feature-a/results-review.user.md", IDEA_SOURCE_MD);

    const data = collectProcessImprovements(tmpDir);
    const expectedDataJson = `${JSON.stringify(data, null, 2)}\n`;
    await writeFile(tmpDir, "docs/business-os/_data/process-improvements.json", expectedDataJson);
    // No HTML file written — drift should be detected

    expect(() => runCheck(tmpDir)).toThrow("process.exit called with 1");
  });
});

describe("completion lifecycle", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "completion-lifecycle-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("deriveIdeaKey is stable and input-sensitive", () => {
    const key1 = deriveIdeaKey("path/to/file.md", "Title");
    const key2 = deriveIdeaKey("path/to/file.md", "Title");
    expect(key1).toBe(key2);

    const keyDifferentTitle = deriveIdeaKey("path/to/file.md", "Different Title");
    expect(key1).not.toBe(keyDifferentTitle);

    const keyDifferentPath = deriveIdeaKey("path/to/other.md", "Title");
    expect(key1).not.toBe(keyDifferentPath);
  });

  it("collectProcessImprovements skips an idea whose key is in the completed registry", async () => {
    const sourceRelPath = "docs/plans/feature-a/results-review.user.md";
    const ideaTitle = "Add ranking layer";
    const ideaKey = deriveIdeaKey(sourceRelPath, ideaTitle);

    await writeFile(
      tmpDir,
      sourceRelPath,
      `---
Business-Unit: BRIK
Review-date: 2026-02-25
---
# Results Review

## New Idea Candidates
- Add ranking layer | Trigger observation: test | Suggested next action: spike
`,
    );

    const registry = {
      schema_version: "completed-ideas.v1",
      entries: [
        {
          idea_key: ideaKey,
          title: ideaTitle,
          source_path: sourceRelPath,
          plan_slug: "some-plan",
          completed_at: "2026-02-26",
        },
      ],
    };
    await writeFile(
      tmpDir,
      "docs/business-os/_data/completed-ideas.json",
      `${JSON.stringify(registry, null, 2)}\n`,
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(0);
  });

  it("collectProcessImprovements suppresses a struck-through bullet but keeps a normal bullet", async () => {
    await writeFile(
      tmpDir,
      "docs/plans/feature-a/results-review.user.md",
      `---
Business-Unit: BRIK
Review-date: 2026-02-25
---
# Results Review

## New Idea Candidates
- Normal idea to keep
- ~~Some completed idea~~
`,
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(1);
    expect(data.ideaItems[0]?.title).toBe("Normal idea to keep");
    const titles = data.ideaItems.map((item) => item.title);
    expect(titles).not.toContain("~~Some completed idea~~");
  });

  it("collectProcessImprovements suppresses none-placeholder bullets in all forms", async () => {
    await writeFile(
      tmpDir,
      "docs/plans/feature-a/results-review.user.md",
      `---
Business-Unit: BRIK
Review-date: 2026-02-25
---
# Results Review

## New Idea Candidates
- Real idea to keep
- None.
- None identified.
- None for the other four categories.
- New open-source package: None identified.
- New skill: None — this was a standard flow.
`,
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(1);
    expect(data.ideaItems[0]?.title).toBe("Real idea to keep");
  });

  it("appendCompletedIdea is idempotent — calling twice yields one entry", async () => {
    const entry = {
      title: "My idea",
      source_path: "docs/plans/test/results-review.user.md",
      plan_slug: "test-plan",
      completed_at: "2026-02-26",
    };

    appendCompletedIdea(tmpDir, entry);
    appendCompletedIdea(tmpDir, entry);

    const registryPath = path.join(tmpDir, "docs/business-os/_data/completed-ideas.json");
    const raw = await fs.readFile(registryPath, "utf8");
    const registry = JSON.parse(raw) as { entries: unknown[] };
    expect(registry.entries).toHaveLength(1);
  });
});
