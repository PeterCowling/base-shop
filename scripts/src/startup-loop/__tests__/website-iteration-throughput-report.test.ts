import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  buildWebsiteIterationThroughputReport,
  generateWebsiteIterationThroughputReport,
} from "../website-iteration-throughput-report.js";

describe("website-iteration-throughput-report", () => {
  it("TC-09-01: calculates required throughput metrics from synthetic pilot data", () => {
    const report = buildWebsiteIterationThroughputReport({
      business: "TEST",
      asOfDate: "2026-02-24",
      cycles: [
        {
          cycleId: "cycle-1",
          artifactChangedAt: "2026-02-20T10:00:00.000Z",
          siteChangeMergedAt: "2026-02-20T16:00:00.000Z",
          manualTouches: 2,
          reworkCount: 1,
        },
        {
          cycleId: "cycle-2",
          artifactChangedAt: "2026-02-21T10:00:00.000Z",
          siteChangeMergedAt: "2026-02-21T13:00:00.000Z",
          manualTouches: 1,
          reworkCount: 0,
        },
      ],
    });

    expect(report.metrics.cycleCount).toBe(2);
    expect(report.metrics.completeCycleCount).toBe(2);
    expect(report.metrics.leadTimeHoursAvg).toBe(4.5);
    expect(report.metrics.manualTouchesTotal).toBe(3);
    expect(report.metrics.reworkTotal).toBe(1);
    expect(report.metrics.dataGaps).toHaveLength(0);
  });

  it("TC-09-02: marks missing cycle data as explicit gaps", () => {
    const report = buildWebsiteIterationThroughputReport({
      business: "TEST",
      cycles: [
        {
          cycleId: "cycle-gap",
          artifactChangedAt: "2026-02-22T10:00:00.000Z",
          manualTouches: 2,
        },
      ],
    });

    expect(report.metrics.leadTimeHoursAvg).toBeNull();
    expect(report.metrics.dataGaps.join("\n")).toContain("missing valid timestamps");
    expect(report.metrics.dataGaps.join("\n")).toContain("missing reworkCount");
  });

  it("writes markdown report artifact", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "throughput-report-"));
    const inputPath = "docs/business-os/strategy/TEST/website-iteration-cycles.json";
    const outputPath =
      "docs/business-os/strategy/TEST/website-iteration-throughput-report.user.md";

    fs.mkdirSync(path.join(repoRoot, "docs/business-os/strategy/TEST"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(repoRoot, inputPath),
      `${JSON.stringify(
        {
          cycles: [
            {
              cycleId: "cycle-1",
              artifactChangedAt: "2026-02-20T10:00:00.000Z",
              siteChangeMergedAt: "2026-02-20T12:00:00.000Z",
              manualTouches: 1,
              reworkCount: 0,
            },
          ],
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const report = generateWebsiteIterationThroughputReport({
      business: "TEST",
      inputPath,
      outputPath,
      repoRoot,
      asOfDate: "2026-02-24",
    });

    expect(report.metrics.cycleCount).toBe(1);
    const markdown = fs.readFileSync(path.join(repoRoot, outputPath), "utf8");
    expect(markdown).toContain("Website Iteration Throughput");
    expect(markdown).toContain("lead time");
  });
});
