import { readFileSync } from "node:fs";

import { getFrontmatterString, hasSection, parseFrontmatter } from "./markdown.js";

export interface AnalysisValidationError {
  field: string;
  message: string;
}

export interface AnalysisValidationResult {
  valid: boolean;
  errors: AnalysisValidationError[];
}

const REQUIRED_FIELDS = [
  "Type",
  "Status",
  "Domain",
  "Last-updated",
  "Feature-Slug",
  "Execution-Track",
  "Primary-Execution-Skill",
  "Deliverable-Type",
  "Workstream",
  "Related-Fact-Find",
] as const;

const VALID_STATUSES = new Set([
  "Draft",
  "Ready-for-planning",
  "Needs-input",
  "Infeasible",
  "Superseded",
  "Historical",
  "Complete",
]);

const VALID_EXECUTION_TRACKS = new Set(["code", "business-artifact", "mixed"]);
const VALID_DELIVERABLE_TYPES = new Set([
  "code-change",
  "email-message",
  "whatsapp-message",
  "product-brief",
  "marketing-asset",
  "spreadsheet",
  "multi-deliverable",
]);

/* eslint-disable ds/no-hardcoded-copy -- SKILL-2401 [ttl=2026-12-31] Internal markdown section labels for deterministic artifact validation. */
const REQUIRED_SECTION_ALIASES: ReadonlyArray<readonly string[]> = [
  ["Decision Frame"],
  ["Inherited Outcome Contract"],
  ["Fact-Find Reference"],
  ["Evaluation Criteria"],
  ["Options Considered"],
  ["Chosen Approach"],
  ["End-State Operating Model"],
  ["Planning Handoff"],
  ["Risks to Carry Forward"],
  ["Planning Readiness"],
];
/* eslint-enable ds/no-hardcoded-copy */

export function validateAnalysisFile(
  analysisPath: string,
): AnalysisValidationResult {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI path is operator-provided local file input [ttl=2026-12-31]
  const content = readFileSync(analysisPath, "utf8");
  return validateAnalysisMarkdown(content);
}

export function validateAnalysisMarkdown(
  analysisMarkdown: string,
): AnalysisValidationResult {
  const errors: AnalysisValidationError[] = [];
  const frontmatter = parseFrontmatter(analysisMarkdown).frontmatter;

  for (const required of REQUIRED_FIELDS) {
    const value = getFrontmatterString(frontmatter, required);
    if (!value) {
      errors.push({
        field: required,
        message: `${required} is required.`,
      });
    }
  }

  const type = getFrontmatterString(frontmatter, "Type");
  if (type && type !== "Analysis") {
    errors.push({
      field: "Type",
      message: `Expected Type: Analysis; found "${type}".`,
    });
  }

  const status = getFrontmatterString(frontmatter, "Status");
  if (status && !VALID_STATUSES.has(status)) {
    errors.push({
      field: "Status",
      message: `Invalid Status "${status}".`,
    });
  }

  const track = getFrontmatterString(frontmatter, "Execution-Track");
  if (track && !VALID_EXECUTION_TRACKS.has(track)) {
    errors.push({
      field: "Execution-Track",
      message: `Invalid Execution-Track "${track}".`,
    });
  }

  const deliverableType = getFrontmatterString(frontmatter, "Deliverable-Type");
  if (deliverableType && !VALID_DELIVERABLE_TYPES.has(deliverableType)) {
    errors.push({
      field: "Deliverable-Type",
      message: `Invalid Deliverable-Type "${deliverableType}".`,
    });
  }

  for (const aliases of REQUIRED_SECTION_ALIASES) {
    if (!aliases.some((section) => hasSection(analysisMarkdown, section))) {
      errors.push({
        field: aliases[0],
        message: `Missing required section: ${aliases[0]}.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
