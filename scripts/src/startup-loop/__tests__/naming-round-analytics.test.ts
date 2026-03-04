import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { type SidecarEvent,writeSidecarEvent } from "../naming/event-log-writer";
import {
  buildRoundAnalytics,
  collectSidecarRoundSources,
  formatRoundAnalyticsMarkdown,
  generateRoundAnalytics,
  type SidecarRoundSource,
} from "../naming/round-analytics";

function makeEvent(overrides: Partial<SidecarEvent>): SidecarEvent {
  return {
    schema_version: "v1",
    event_id: `evt-${Math.random().toString(16).slice(2)}`,
    business: "HEAD",
    round: 1,
    run_date: "2026-02-26",
    stage: "generated",
    candidate: {
      name: "Alyra",
      pattern: "A",
      domain_string: "alyra.com",
      provenance: null,
      scores: null,
    },
    rdap: null,
    model_output: null,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("naming round analytics", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "naming-round-analytics-"));
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  function sidecarDir(business: string, pipeline: "company" | "product"): string {
    const dirname = pipeline === "company" ? "naming-sidecars" : "product-naming-sidecars";
    return path.join(
      tempRoot,
      "docs/business-os/strategy",
      business,
      "assessment/naming-workbench",
      dirname,
    );
  }

  it("collectSidecarRoundSources finds mixed company/product rounds", () => {
    writeSidecarEvent(makeEvent({ business: "HEAD" }), sidecarDir("HEAD", "company"), { mkdirIfMissing: true });
    writeSidecarEvent(
      makeEvent({ business: "HBAG", stage: "tm_prescreened", run_date: "2026-02-27", round: 1 }),
      sidecarDir("HBAG", "product"),
      { mkdirIfMissing: true },
    );

    const sources = collectSidecarRoundSources(path.join(tempRoot, "docs/business-os/strategy"));

    expect(sources).toHaveLength(2);
    expect(sources.map((s) => s.business)).toEqual(["HBAG", "HEAD"]);
    expect(sources.map((s) => s.pipeline_type)).toEqual(["product", "company"]);
  });

  it("buildRoundAnalytics reports rdap yield and tm label coverage", () => {
    const sources: SidecarRoundSource[] = [];

    const companyDir = sidecarDir("HEAD", "company");
    writeSidecarEvent(makeEvent({ business: "HEAD", stage: "generated", candidate: { ...makeEvent({}).candidate, name: "Alyra" } }), companyDir, { mkdirIfMissing: true });
    writeSidecarEvent(makeEvent({ business: "HEAD", stage: "generated", candidate: { ...makeEvent({}).candidate, name: "Brivio" } }), companyDir);
    writeSidecarEvent(
      makeEvent({
        business: "HEAD",
        stage: "rdap_checked",
        candidate: { ...makeEvent({}).candidate, name: "Alyra" },
        rdap: { status: "available", statusCode: 404, retries: 0, latencyMs: 10 },
      }),
      companyDir,
    );

    const productDir = sidecarDir("HBAG", "product");
    writeSidecarEvent(
      makeEvent({
        business: "HBAG",
        stage: "tm_prescreened",
        run_date: "2026-02-27",
        candidate: { ...makeEvent({}).candidate, name: "Linea" },
        tm_prescreen: {
          euipo_url: "https://example.com/euipo",
          wipo_url: "https://example.com/wipo",
          uibm_url: "https://example.com/uibm",
          classes: [25],
          operator_result: "clear",
        },
      }),
      productDir,
      { mkdirIfMissing: true },
    );
    writeSidecarEvent(
      makeEvent({
        business: "HBAG",
        stage: "tm_prescreened",
        run_date: "2026-02-27",
        candidate: { ...makeEvent({}).candidate, name: "Filo" },
        tm_prescreen: {
          euipo_url: "https://example.com/euipo",
          wipo_url: "https://example.com/wipo",
          uibm_url: "https://example.com/uibm",
          classes: [25],
          operator_result: null,
        },
      }),
      productDir,
    );

    sources.push(
      {
        business: "HEAD",
        pipeline_type: "company",
        source_file: "HEAD/assessment/naming-workbench/naming-sidecars/2026-02-26-round-1.jsonl",
        run_date: "2026-02-26",
        round: 1,
      },
      {
        business: "HBAG",
        pipeline_type: "product",
        source_file: "HBAG/assessment/naming-workbench/product-naming-sidecars/2026-02-27-round-1.jsonl",
        run_date: "2026-02-27",
        round: 1,
      },
    );

    const analytics = buildRoundAnalytics(sources, path.join(tempRoot, "docs/business-os/strategy"));

    expect(analytics.records).toHaveLength(2);

    const company = analytics.records.find((r) => r.pipeline_type === "company");
    const product = analytics.records.find((r) => r.pipeline_type === "product");

    expect(company?.rdap?.available).toBe(1);
    expect(company?.rdap?.yield_pct).toBe(50);
    expect(product?.tm_operator?.total).toBe(2);
    expect(product?.tm_operator?.labeled).toBe(1);
    expect(product?.tm_operator?.label_coverage_pct).toBe(50);
  });

  it("generateRoundAnalytics writes deterministic artifacts", () => {
    writeSidecarEvent(makeEvent({ business: "HEAD" }), sidecarDir("HEAD", "company"), { mkdirIfMissing: true });

    const jsonOut = path.join(tempRoot, "out", "analytics.json");
    const mdOut = path.join(tempRoot, "out", "analytics.md");

    const result = generateRoundAnalytics({
      sourceRoot: path.join(tempRoot, "docs/business-os/strategy"),
      jsonOutputPath: jsonOut,
      markdownOutputPath: mdOut,
    });

    expect(result.rounds).toBe(1);
    expect(fs.existsSync(jsonOut)).toBe(true);
    expect(fs.existsSync(mdOut)).toBe(true);

    const markdown = fs.readFileSync(mdOut, "utf8");
    expect(markdown).toContain("# Naming Round Analytics (Latest)");
  });

  it("formatRoundAnalyticsMarkdown includes round detail table", () => {
    const analytics = {
      schema_version: "naming-round-analytics.v1" as const,
      generated_at: "2026-03-04T21:00:00.000Z",
      source_root: "/tmp/source",
      source_files: ["HEAD/assessment/naming-workbench/naming-sidecars/2026-02-26-round-7.jsonl"],
      records: [
        {
          business: "HEAD",
          pipeline_type: "company" as const,
          run_date: "2026-02-26",
          round: 7,
          source_file: "HEAD/assessment/naming-workbench/naming-sidecars/2026-02-26-round-7.jsonl",
          event_count: 501,
          unique_candidates: 250,
          stage_counts: {
            generated: 250,
            i_gate_eliminated: 0,
            rdap_checked: 250,
            shortlisted: 0,
            finalist: 1,
            tm_prescreened: 0,
          },
          rdap: {
            available: 126,
            taken: 125,
            unknown: 0,
            post_i_gate: 250,
            yield_pct: 50.4,
          },
          tm_operator: null,
        },
      ],
      totals: {
        total_events: 501,
        total_rounds: 1,
        total_source_files: 1,
        by_pipeline: {
          company: { rounds: 1, events: 501 },
          product: { rounds: 0, events: 0 },
        },
        by_business: {
          HEAD: { rounds: 1, events: 501 },
        },
      },
    };

    const md = formatRoundAnalyticsMarkdown(analytics);
    expect(md).toContain("## Round detail");
    expect(md).toContain("2026-02-26");
    expect(md).toContain("50.40%");
  });
});
