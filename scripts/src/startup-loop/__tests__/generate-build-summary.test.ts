import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  classifyDomain,
  generateBuildSummaryRows,
  sanitizeAndCap,
  serializeRows,
  shouldExcludeSourcePath,
  sortRows,
} from "../generate-build-summary";
import { emitBuildEvent, writeBuildEvent } from "../lp-do-build-event-emitter";

const FIXED_TIMESTAMP = "2026-02-25T00:00:00.000Z";

async function writeFile(root: string, relativePath: string, content: string): Promise<void> {
  const absPath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, content, "utf8");
}

describe("generate-build-summary", () => {
  it("prefers .user.md over .md and .user.html for the same stem", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "build-summary-stem-"));

    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/2026-02-25-same-stem.user.html",
      "<h1>HTML Variant</h1><h2>Why</h2><p>html why</p>",
    );
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/2026-02-25-same-stem.md",
      "# Markdown Variant\n\n## Why\nmarkdown why",
    );
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/2026-02-25-same-stem.user.md",
      "---\ntitle: Preferred Variant\n---\n\n## Why\nchosen why\n\n## Intended outcome\nchosen intended",
    );

    const rows = generateBuildSummaryRows(repoRoot, {
      timestampResolver: () => FIXED_TIMESTAMP,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.sourcePath).toBe(
      "docs/business-os/strategy/BRIK/2026-02-25-same-stem.user.md",
    );
    expect(rows[0]?.what).toBe("Preferred Variant");
    expect(rows[0]?.why).toBe("chosen why");
    expect(rows[0]?.intended).toBe("chosen intended");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("applies source exclusions for templates, archives, and index files", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "build-summary-exclusions-"));

    await writeFile(
      repoRoot,
      "docs/business-os/strategy/HEAD/valid.user.md",
      "# Valid\n\n## Why\nreal",
    );
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/HEAD/index.user.md",
      "# Index",
    );
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/HEAD/_templates/template.user.md",
      "# Template",
    );
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/HEAD/_archive/old.user.md",
      "# Old",
    );

    const rows = generateBuildSummaryRows(repoRoot, {
      timestampResolver: () => FIXED_TIMESTAMP,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.sourcePath).toBe("docs/business-os/strategy/HEAD/valid.user.md");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("includes only top-level startup-baselines files", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "build-summary-baselines-"));

    await writeFile(
      repoRoot,
      "docs/business-os/startup-baselines/HEAD-offer.md",
      "# Offer\n\n## Why\nhead",
    );
    await writeFile(
      repoRoot,
      "docs/business-os/startup-baselines/HBAG/demand-evidence-pack.md",
      "# Demand Evidence\n\n## Why\nhbag",
    );

    const rows = generateBuildSummaryRows(repoRoot, {
      timestampResolver: () => FIXED_TIMESTAMP,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.business).toBe("HEAD");
    expect(rows[0]?.sourcePath).toBe("docs/business-os/startup-baselines/HEAD-offer.md");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("uses businesses.json as the authoritative business list when present", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "build-summary-business-catalog-"));

    await writeFile(
      repoRoot,
      "docs/business-os/strategy/businesses.json",
      JSON.stringify(
        {
          businesses: [{ id: "HEAD" }],
        },
        null,
        2,
      ),
    );
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/HEAD/allowed.user.md",
      "# Allowed\n\n## Why\nhead",
    );
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/blocked.user.md",
      "# Blocked\n\n## Why\nbrik",
    );

    const rows = generateBuildSummaryRows(repoRoot, {
      timestampResolver: () => FIXED_TIMESTAMP,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.business).toBe("HEAD");
    expect(rows[0]?.sourcePath).toBe("docs/business-os/strategy/HEAD/allowed.user.md");
    expect(rows[0]?.what).toBe("Allowed");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("maps strategy filenames to deterministic domains", () => {
    expect(classifyDomain("docs/business-os/strategy/BRIK/ga4-search-notes.user.md")).toBe(
      "SEO / Measurement",
    );
    expect(classifyDomain("docs/business-os/strategy/BRIK/brand-identity.user.md")).toBe(
      "Brand / UI",
    );
    expect(classifyDomain("docs/business-os/strategy/BRIK/revenue-forecast.user.md")).toBe(
      "Forecast / Pricing",
    );
    expect(classifyDomain("docs/business-os/strategy/BRIK/plan.user.md")).toBe("Planning");
    expect(classifyDomain("docs/business-os/strategy/BRIK/misc.user.md")).toBe("Strategy");
    expect(classifyDomain("docs/business-os/site-upgrades/BRIK/latest.user.md")).toBe(
      "UI / Site",
    );
    expect(classifyDomain("docs/business-os/market-research/BRIK/latest.user.md")).toBe(
      "Research",
    );
    expect(classifyDomain("docs/business-os/startup-baselines/BRIK-offer.md")).toBe(
      "Baseline",
    );
  });

  it("sorts rows by date desc then sourcePath asc and serializes with trailing newline", () => {
    const rows = sortRows([
      {
        date: "2026-02-25T00:00:00.000Z",
        business: "BRIK",
        domain: "Planning",
        what: "b",
        why: "—",
        intended: "—",
        links: [{ label: "Open", href: "/docs/business-os/strategy/BRIK/b.user.md" }],
        sourcePath: "docs/business-os/strategy/BRIK/b.user.md",
      },
      {
        date: "2026-02-25T00:00:00.000Z",
        business: "BRIK",
        domain: "Planning",
        what: "a",
        why: "—",
        intended: "—",
        links: [{ label: "Open", href: "/docs/business-os/strategy/BRIK/a.user.md" }],
        sourcePath: "docs/business-os/strategy/BRIK/a.user.md",
      },
      {
        date: "2026-02-24T00:00:00.000Z",
        business: "BRIK",
        domain: "Planning",
        what: "old",
        why: "—",
        intended: "—",
        links: [{ label: "Open", href: "/docs/business-os/strategy/BRIK/old.user.md" }],
        sourcePath: "docs/business-os/strategy/BRIK/old.user.md",
      },
    ]);

    expect(rows.map((row) => row.sourcePath)).toEqual([
      "docs/business-os/strategy/BRIK/a.user.md",
      "docs/business-os/strategy/BRIK/b.user.md",
      "docs/business-os/strategy/BRIK/old.user.md",
    ]);

    const serialized = serializeRows(rows);
    expect(serialized.endsWith("\n")).toBe(true);
    expect(serialized).toContain("\"sourcePath\": \"docs/business-os/strategy/BRIK/a.user.md\"");
  });

  it("sanitizes and caps extracted text", () => {
    expect(sanitizeAndCap("  too    much   space  ")).toBe("too much space");

    const capped = sanitizeAndCap("x".repeat(500), 10);
    expect(capped.length).toBeLessThanOrEqual(10);
    expect(capped.endsWith("…")).toBe(true);
  });

  it("exclusion helper returns true for blocked paths", () => {
    expect(shouldExcludeSourcePath("docs/business-os/strategy/HEAD/index.user.md")).toBe(true);
    expect(
      shouldExcludeSourcePath("docs/business-os/strategy/HEAD/_templates/template.user.md"),
    ).toBe(true);
    expect(shouldExcludeSourcePath("docs/business-os/strategy/HEAD/_archive/a.user.md")).toBe(
      true,
    );
    expect(shouldExcludeSourcePath("docs/business-os/strategy/HEAD/keep.user.md")).toBe(false);
  });

  it("uses em dash fallback when why/intended sections are missing", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "build-summary-missing-fields-"));

    await writeFile(
      repoRoot,
      "docs/business-os/strategy/HEAD/no-sections.user.md",
      "# No Sections",
    );

    const rows = generateBuildSummaryRows(repoRoot, {
      timestampResolver: () => FIXED_TIMESTAMP,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.why).toBe("—");
    expect(rows[0]?.intended).toBe("—");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // TC-05-C: generator prefers canonical build-event.json when present
  // and why_source is "operator"
  // -------------------------------------------------------------------------

  it("TC-05-C: prefers canonical build-event.json why value over heuristic when Build-Event-Ref present and why_source=operator", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "build-summary-canonical-"));

    const featureSlug = "test-feature-canonical";
    const canonicalWhy =
      "Improve DTC conversion by removing friction from the booking flow — operator-authored.";
    const canonicalIntended =
      ">=10% improvement in DTC booking conversion within 30 days";

    // Write strategy artifact with Build-Event-Ref frontmatter
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/2026-02-25-test-build.user.md",
      [
        "---",
        `Build-Event-Ref: docs/plans/${featureSlug}/build-event.json`,
        "---",
        "",
        "# Test Build",
        "",
        "## Why",
        "This heuristic why should NOT appear — canonical preferred.",
        "",
        "## Intended outcome",
        "This heuristic intended should NOT appear.",
      ].join("\n"),
    );

    // Write canonical build-event.json
    const event = emitBuildEvent({
      feature_slug: featureSlug,
      build_id: `${featureSlug}:2026-02-25`,
      why: canonicalWhy,
      why_source: "operator",
      intended_outcome: {
        type: "measurable",
        statement: canonicalIntended,
        source: "operator",
      },
      emitted_at: "2026-02-25T12:00:00.000Z",
    });
    const planDir = path.join(repoRoot, "docs", "plans", featureSlug);
    await fs.mkdir(planDir, { recursive: true });
    writeBuildEvent(event, planDir);

    const rows = generateBuildSummaryRows(repoRoot, {
      timestampResolver: () => FIXED_TIMESTAMP,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.why).toBe(canonicalWhy);
    expect(rows[0]?.intended).toBe(canonicalIntended);

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // TC-05-D: generator falls back to heuristic when build-event.json absent
  // -------------------------------------------------------------------------

  it("TC-05-D: falls back to heuristic extraction when no Build-Event-Ref present", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "build-summary-fallback-"));

    // Strategy artifact without Build-Event-Ref
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/2026-02-25-no-ref.user.md",
      [
        "# No Canonical Ref",
        "",
        "## Why",
        "heuristic why extracted from markdown",
        "",
        "## Intended outcome",
        "heuristic intended outcome",
      ].join("\n"),
    );

    const rows = generateBuildSummaryRows(repoRoot, {
      timestampResolver: () => FIXED_TIMESTAMP,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.why).toBe("heuristic why extracted from markdown");
    expect(rows[0]?.intended).toBe("heuristic intended outcome");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("TC-05-D variant: falls back to heuristic when Build-Event-Ref present but file missing", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "build-summary-missing-ref-"));

    // Strategy artifact with Build-Event-Ref, but file does not exist
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/2026-02-25-missing-ref.user.md",
      [
        "---",
        "Build-Event-Ref: docs/plans/nonexistent-feature/build-event.json",
        "---",
        "",
        "# Missing Ref",
        "",
        "## Why",
        "heuristic fallback when canonical absent",
      ].join("\n"),
    );

    const rows = generateBuildSummaryRows(repoRoot, {
      timestampResolver: () => FIXED_TIMESTAMP,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.why).toBe("heuristic fallback when canonical absent");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("TC-05-D variant: falls back to heuristic when Build-Event-Ref event has why_source=heuristic", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "build-summary-heuristic-src-"));

    const featureSlug = "test-feature-heuristic-src";

    // Strategy artifact with Build-Event-Ref
    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/2026-02-25-heuristic-src.user.md",
      [
        "---",
        `Build-Event-Ref: docs/plans/${featureSlug}/build-event.json`,
        "---",
        "",
        "# Heuristic Src",
        "",
        "## Why",
        "heuristic section why",
        "",
        "## Intended outcome",
        "heuristic section intended",
      ].join("\n"),
    );

    // Write canonical build-event.json with why_source: heuristic (should NOT override)
    const event = emitBuildEvent({
      feature_slug: featureSlug,
      build_id: `${featureSlug}:2026-02-25`,
      why: "—",
      why_source: "heuristic",
      intended_outcome: null,
      emitted_at: "2026-02-25T12:00:00.000Z",
    });
    const planDir = path.join(repoRoot, "docs", "plans", featureSlug);
    await fs.mkdir(planDir, { recursive: true });
    writeBuildEvent(event, planDir);

    const rows = generateBuildSummaryRows(repoRoot, {
      timestampResolver: () => FIXED_TIMESTAMP,
    });

    expect(rows).toHaveLength(1);
    // Heuristic-sourced build event should NOT override the markdown extraction
    expect(rows[0]?.why).toBe("heuristic section why");
    expect(rows[0]?.intended).toBe("heuristic section intended");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });
});
