import path from "path";

import {
  type AssessmentCompletionResult,
  scanAssessmentCompletion,
  STAGE_PATTERNS,
} from "./assessment-completion-scanner";

const TOTAL_STAGES = STAGE_PATTERNS.length;

function run(): void {
  const repoRoot = process.cwd();
  const strategyRoot = path.join(repoRoot, "docs/business-os/strategy");
  const verbose = process.argv.includes("--verbose");

  const results = scanAssessmentCompletion({ strategyRoot });

  if (results.length === 0) {
    console.log("[assessment-completion] No businesses found.");
    return;
  }

  const grouped = new Map<string, AssessmentCompletionResult[]>();
  for (const r of results) {
    const existing = grouped.get(r.business);
    if (existing) {
      existing.push(r);
    } else {
      grouped.set(r.business, [r]);
    }
  }

  console.log(
    `[assessment-completion] ${grouped.size} businesses scanned, ${TOTAL_STAGES} stages per business`
  );

  let totalComplete = 0;
  let totalConditional = 0;
  let totalNoArtifactPattern = 0;
  let totalNotFound = 0;

  for (const [business, stages] of grouped) {
    const complete = stages.filter((s) => s.status === "complete");
    const conditional = stages.filter(
      (s) => s.conditional && s.status !== "complete"
    );

    totalComplete += complete.length;
    totalConditional += conditional.length;
    totalNoArtifactPattern += stages.filter(
      (s) => s.status === "no_artifact_pattern"
    ).length;
    totalNotFound += stages.filter((s) => s.status === "not_found").length;

    const conditionalNote =
      conditional.length > 0 ? `, ${conditional.length} conditional` : "";
    console.log(
      `\n${business} (${complete.length}/${TOTAL_STAGES} complete${conditionalNote}):`
    );

    for (const stage of stages) {
      const label = `${stage.stage_id} ${stage.stage_name}`;
      const paddedLabel = label.padEnd(40);

      if (stage.status === "complete") {
        const date = stage.artifact_date ?? "no date";
        console.log(
          `  \u2713 ${paddedLabel} ${date.padEnd(12)} ${stage.artifact_path}`
        );
      } else if (stage.status === "no_artifact_pattern") {
        console.log(`  \u2014 ${paddedLabel} (no artifact pattern)`);
      } else if (stage.status === "not_found" && stage.conditional) {
        console.log(`  \u2014 ${paddedLabel} not found (conditional)`);
      } else if (stage.status === "not_found" && verbose) {
        console.log(`  \u2014 ${paddedLabel} not found`);
      }
    }
  }

  console.log(
    `\nTotals: ${totalComplete} complete, ${totalNoArtifactPattern} no artifact pattern, ${totalNotFound} not found, ${totalConditional} conditional pending`
  );
}

run();
