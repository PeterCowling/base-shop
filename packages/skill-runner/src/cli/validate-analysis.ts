#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { validateAnalysisMarkdown } from "../validate-analysis.js";

function main(): void {
  const analysisPath = process.argv[2];
  if (!analysisPath) {
    console.error("Usage: validate-analysis <analysis.md>");
    process.exit(2);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI path is operator-provided local file input [ttl=2026-12-31]
  const markdown = readFileSync(analysisPath, "utf8");
  const result = validateAnalysisMarkdown(markdown);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.valid ? 0 : 1);
}

main();
