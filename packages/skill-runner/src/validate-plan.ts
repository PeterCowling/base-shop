import { readFileSync } from "node:fs";

import {
  getFrontmatterString,
  parseConfidencePercent,
  parseFrontmatter,
  parseTaskBlocks,
} from "./markdown.js";

export interface PlanValidationError {
  field: string;
  message: string;
}

export interface PlanValidationResult {
  valid: boolean;
  errors: PlanValidationError[];
  activeImplementTaskIds: string[];
}

const REQUIRED_FIELDS = [
  "Type",
  "Status",
  "Domain",
  "Last-reviewed",
  "Relates-to charter",
  "Execution-Track",
  "Primary-Execution-Skill",
  "Deliverable-Type",
  "Feature-Slug",
  "Workstream",
] as const;

const VALID_STATUSES = new Set([
  "Draft",
  "Active",
  "Archived",
  "Complete",
  "Superseded",
  "Historical",
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

export function validatePlanFile(planPath: string): PlanValidationResult {
  const content = readFileSync(planPath, "utf8");
  return validatePlanMarkdown(content);
}

export function validatePlanMarkdown(planMarkdown: string): PlanValidationResult {
  const errors: PlanValidationError[] = [];
  const parsed = parseFrontmatter(planMarkdown);
  const frontmatter = parsed.frontmatter;

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
  if (type && type !== "Plan") {
    errors.push({
      field: "Type",
      message: `Expected Type: Plan; found "${type}".`,
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

  const tasks = parseTaskBlocks(planMarkdown);
  const eligibleImplementTasks = tasks
    .filter(
      (task) =>
        (task.fields["type"] ?? "").trim().toUpperCase() === "IMPLEMENT" &&
        (parseConfidencePercent(task.fields["confidence"]) ?? 0) >= 80,
    )
    .map((task) => task.id);

  if (status === "Active" && eligibleImplementTasks.length === 0) {
    errors.push({
      field: "Status",
      message:
        "Status Active requires at least one IMPLEMENT task with confidence >= 80%.",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    activeImplementTaskIds: eligibleImplementTasks,
  };
}
