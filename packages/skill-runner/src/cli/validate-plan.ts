#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { validatePlanMarkdown } from "../validate-plan.js";

function main(): void {
  const planPath = process.argv[2];
  if (!planPath) {
    console.error("Usage: validate-plan <plan.md>");
    process.exit(2);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI path is operator-provided local file input [ttl=2026-12-31]
  const markdown = readFileSync(planPath, "utf8");
  const result = validatePlanMarkdown(markdown);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.valid ? 0 : 1);
}

main();
