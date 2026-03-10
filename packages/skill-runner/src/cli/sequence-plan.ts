#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

import { sequencePlanMarkdown } from "../sequence-plan.js";

function main(): void {
  const planPath = process.argv[2];
  if (!planPath) {
    console.error("Usage: sequence-plan <plan.md>");
    process.exit(2);
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI path is operator-provided local file input [ttl=2026-12-31]
  const planMarkdown = readFileSync(planPath, "utf8");
  const result = sequencePlanMarkdown(planMarkdown);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI path is operator-provided local file output [ttl=2026-12-31]
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
