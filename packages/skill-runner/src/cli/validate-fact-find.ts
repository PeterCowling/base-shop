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
  const factFind = readFileSync(factFindPath, "utf8");
  let critique: string | null = null;
  if (critiquePath) {
    try {
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
