import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  extractSignalReviewRequiredItems,
  writeSignalReviewRequiredSidecar,
} from "../diagnostics/signal-review-review-required";

async function writeFile(root: string, relativePath: string, content: string): Promise<string> {
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf8");
  return absolutePath;
}

describe("signal-review-review-required", () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "signal-review-review-required-"));
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("extracts repeated findings into review-required items with owner, due date, and escalation state", async () => {
    const currentPath = await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.md",
      `---
Type: Signal-Review
Business: BRIK
Run-date: 20260226
---

# Review

## Top Findings

### Finding 1: Feedback Loop Closure — no second weekly readout

- Fingerprint: \`P08-S10-no-second-weekly-readout\`
- Status: REPEAT (severity escalated: day-14 gate review is now due tomorrow)

**Why this matters**: The week-two KPCS is still missing.

**Promotion stub** — paste into \`docs/plans/<finding-slug>/fact-find.md\` and fill remaining fields:

\`\`\`yaml
---
Type: Fact-Find
---
\`\`\`

Fingerprint: \`P08-S10-no-second-weekly-readout\`

**Summary** (3 bullets — fill before promoting):
- What: no second weekly readout exists
- Why: day-14 gate review is blocked
- Next: Produce the week-two KPCS now
`,
    );

    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/marketing/signal-review-20260218-1238-W08.md",
      `---
Type: Signal-Review
Business: BRIK
Run-date: 20260218
---

## Top Findings

### Finding 1: Feedback Loop Closure — no second weekly readout

- Fingerprint: \`P08-S10-no-second-weekly-readout\`
- Status: Novel
`,
    );

    const sidecar = extractSignalReviewRequiredItems(currentPath, {
      repoRoot,
      defaultOwner: "Pete",
      todayIso: "2026-02-26",
    });

    expect(sidecar).not.toBeNull();
    expect(sidecar?.schema_version).toBe("signal-review.review-required.v1");
    expect(sidecar?.items).toHaveLength(1);
    expect(sidecar?.items[0]?.owner).toBe("Pete");
    expect(sidecar?.items[0]?.due_date).toBe("2026-02-29");
    expect(sidecar?.items[0]?.escalation_state).toBe("escalated");
    expect(sidecar?.items[0]?.recurrence_count).toBe(2);
    expect(sidecar?.items[0]?.first_seen_run_date).toBe("2026-02-18");
    expect(sidecar?.items[0]?.latest_seen_run_date).toBe("2026-02-26");
    expect(sidecar?.items[0]?.gap_case?.source_kind).toBe("signal_review");
    expect(sidecar?.items[0]?.gap_case?.runtime_binding.candidate_id).toMatch(/^cand-/);
    expect(sidecar?.items[0]?.prescription?.source).toBe("signal_review");
    expect(sidecar?.items[0]?.prescription?.required_route).toBe("lp-do-fact-find");
  });

  it("writes an adjacent review-required sidecar file", async () => {
    const currentPath = await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.md",
      `---
Type: Signal-Review
Business: BRIK
Run-date: 20260226
---

## Top Findings

### Finding 1: Ground Truth Anchoring — stale baseline

- Fingerprint: \`P04-S2A-conversion-signal-zero-no-real-cvr-anchor\`
- Status: REPEAT (new evidence: report-layer baseline still stale)

**Why this matters**: The refreshed measurement baseline is still missing.

**Summary** (3 bullets — fill before promoting):
- What: the baseline is stale
- Why: the gate remains blind
- Next: Refresh the baseline now
`,
    );

    const sidecar = writeSignalReviewRequiredSidecar(currentPath, {
      repoRoot,
      defaultOwner: "Pete",
      todayIso: "2026-02-26",
    });

    const sidecarPath = currentPath.replace(/\.md$/u, ".review-required.json");
    const raw = await fs.readFile(sidecarPath, "utf8");
    const parsed = JSON.parse(raw) as { items?: Array<{ owner?: string }> };

    expect(sidecar).not.toBeNull();
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items?.[0]?.owner).toBe("Pete");
  });
});
