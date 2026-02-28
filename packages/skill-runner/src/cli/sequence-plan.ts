#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

import { sequencePlanMarkdown } from "../sequence-plan.js";

function main(): void {
  const planPath = process.argv[2];
  if (!planPath) {
    console.error("Usage: sequence-plan <plan.md>");
    process.exit(2);
  }

  const planMarkdown = readFileSync(planPath, "utf8");
  const result = sequencePlanMarkdown(planMarkdown);
  writeFileSync(planPath, result.markdown, "utf8");
  process.stdout.write(
    `${JSON.stringify(
      {
        orderedTaskIds: result.orderedTaskIds,
        parallelWaves: result.parallelWaves,
      },
      null,
      2,
    )}\n`,
  );
}

main();
