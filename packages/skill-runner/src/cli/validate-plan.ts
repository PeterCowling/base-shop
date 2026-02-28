#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { validatePlanMarkdown } from "../validate-plan.js";

function main(): void {
  const planPath = process.argv[2];
  if (!planPath) {
    console.error("Usage: validate-plan <plan.md>");
    process.exit(2);
  }
  const markdown = readFileSync(planPath, "utf8");
  const result = validatePlanMarkdown(markdown);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.valid ? 0 : 1);
}

main();
