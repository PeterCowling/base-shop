#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { validatePlanTaskBuildEligibility } from "../confidence-thresholds.js";

function main(): void {
  const planPath = process.argv[2];
  const taskId = process.argv[3];
  if (!planPath || !taskId) {
    console.error("Usage: validate-build-eligibility <plan.md> <TASK-ID>");
    process.exit(2);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI path is operator-provided local file input [ttl=2026-12-31]
  const planMarkdown = readFileSync(planPath, "utf8");
  const result = validatePlanTaskBuildEligibility(planMarkdown, taskId);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.eligible ? 0 : 1);
}

main();
