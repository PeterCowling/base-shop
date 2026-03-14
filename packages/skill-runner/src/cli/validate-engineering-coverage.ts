#!/usr/bin/env node
import { validateEngineeringCoverageFile } from "../validate-engineering-coverage.js";

function main(): void {
  const markdownPath = process.argv[2];
  if (!markdownPath) {
    console.error("Usage: validate-engineering-coverage <artifact.md>");
    process.exit(2);
  }

  const result = validateEngineeringCoverageFile(markdownPath);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.valid ? 0 : 1);
}

main();
