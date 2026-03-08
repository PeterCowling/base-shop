#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { validateFactFindMarkdown } from "../validate-fact-find.js";

function main(): void {
  const factFindPath = process.argv[2];
  const critiquePath = process.argv[3];
  if (!factFindPath) {
    console.error("Usage: validate-fact-find <fact-find.md> [critique-history.md]");
    process.exit(2);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI path is operator-provided local file input [ttl=2026-12-31]
  const factFind = readFileSync(factFindPath, "utf8");
  let critique: string | null = null;
  if (critiquePath) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 Optional CLI path is operator-provided local file input [ttl=2026-12-31]
      critique = readFileSync(critiquePath, "utf8");
    } catch {
      critique = null;
    }
  }
  const result = validateFactFindMarkdown(factFind, critique);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.ready ? 0 : 1);
}

main();
