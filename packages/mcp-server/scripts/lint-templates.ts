#!/usr/bin/env node
/**
 * CI template lint gate.
 *
 * Runs the synchronous linter against email-templates.json — no network
 * calls, no MCP resources. Fast and deterministic.
 *
 * Exit 0 = all clear (warnings printed but non-blocking).
 * Exit 1 = hard errors found (placeholders, here-without-url, policy mismatch).
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import {
  type EmailTemplate,
  lintTemplatesSync,
  partitionIssues,
} from "../src/utils/template-lint.js";

const DATA_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

function loadTemplates(): EmailTemplate[] {
  const content = readFileSync(join(DATA_ROOT, "email-templates.json"), "utf-8");
  return JSON.parse(content) as EmailTemplate[];
}

const templates = loadTemplates();
const issues = lintTemplatesSync(templates);
const { hard, warnings } = partitionIssues(issues);

if (warnings.length > 0) {
  console.warn(`Template lint: ${warnings.length} warning(s):\n`);
  for (const issue of warnings) {
    console.warn(`  [${issue.code}] ${issue.subject}: ${issue.details}`);
  }
  console.warn();
}

if (hard.length === 0) {
  console.info(
    `Template lint: OK (${templates.length} templates, ${warnings.length} warning(s))`
  );
  process.exit(0);
}

console.error(`Template lint: ${hard.length} error(s):\n`);
for (const issue of hard) {
  console.error(`  [${issue.code}] ${issue.subject}: ${issue.details}`);
}
process.exit(1);
