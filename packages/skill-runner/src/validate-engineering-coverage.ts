import { readFileSync } from "node:fs";

import {
  extractSection,
  getFrontmatterString,
  parseFrontmatter,
  parseTaskBlocks,
} from "./markdown.js";

export const ENGINEERING_COVERAGE_AREAS = [
  "UI / visual",
  "UX / states",
  "Security / privacy",
  "Logging / observability / audit",
  "Testing / validation",
  "Data / contracts",
  "Performance / reliability",
  "Rollout / rollback",
] as const;

type EngineeringCoverageArea = (typeof ENGINEERING_COVERAGE_AREAS)[number];

export interface EngineeringCoverageValidationError {
  scope: "artifact" | "task";
  message: string;
  section?: string;
  taskId?: string;
}

export interface EngineeringCoverageValidationResult {
  valid: boolean;
  skipped: boolean;
  artifactType: string | null;
  track: string | null;
  errors: EngineeringCoverageValidationError[];
  warnings: string[];
}

// i18n-exempt -- SKILL-2401 [ttl=2026-12-31] Internal markdown section labels for deterministic artifact validation.
const REQUIRED_SECTION_BY_TYPE: Record<string, string> = {
  "fact-find": "Engineering Coverage Matrix",
  analysis: "Engineering Coverage Comparison",
  plan: "Engineering Coverage",
  "build-record": "Engineering Coverage Evidence",
};

export function validateEngineeringCoverageFile(
  markdownPath: string,
): EngineeringCoverageValidationResult {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI path is operator-provided local file input [ttl=2026-12-31]
  const content = readFileSync(markdownPath, "utf8");
  return validateEngineeringCoverageMarkdown(content);
}

export function validateEngineeringCoverageMarkdown(
  markdown: string,
): EngineeringCoverageValidationResult {
  const warnings: string[] = [];
  const parsed = parseFrontmatter(markdown);
  const type = normalizeArtifactType(getFrontmatterString(parsed.frontmatter, "Type"));
  const artifact = normalizeArtifactType(getFrontmatterString(parsed.frontmatter, "artifact"));
  const artifactType = type ?? artifact;
  const track = getFrontmatterString(parsed.frontmatter, "Execution-Track");

  if (!artifactType) {
    warnings.push("Unable to determine artifact type from Type/artifact frontmatter.");
    return buildSkippedResult(null, track, warnings);
  }

  if (!isCodeBearingTrack(track)) {
    return buildSkippedResult(artifactType, track, warnings);
  }

  const requiredSection = REQUIRED_SECTION_BY_TYPE[artifactType];
  if (!requiredSection) {
    warnings.push(`No engineering coverage contract registered for artifact type "${artifactType}".`);
    return buildSkippedResult(artifactType, track, warnings);
  }

  const errors = validateArtifactSection(markdown, requiredSection);

  if (artifactType === "plan") {
    errors.push(...validatePlanTaskCoverage(markdown, track));
  }

  return {
    valid: errors.length === 0,
    skipped: false,
    artifactType,
    track: track ?? null,
    errors,
    warnings,
  };
}

function buildSkippedResult(
  artifactType: string | null,
  track: string | null,
  warnings: string[],
): EngineeringCoverageValidationResult {
  return {
    valid: true,
    skipped: true,
    artifactType,
    track: track ?? null,
    errors: [],
    warnings,
  };
}

function validateArtifactSection(
  markdown: string,
  requiredSection: string,
): EngineeringCoverageValidationError[] {
  const section = extractSection(markdown, requiredSection);
  if (!section) {
    return [
      {
        scope: "artifact",
        section: requiredSection,
        message: `Missing required section: ${requiredSection}`,
      },
    ];
  }

  return ENGINEERING_COVERAGE_AREAS.filter((area) => !includesCoverageArea(section, area)).map(
    (area) => ({
      scope: "artifact" as const,
      section: requiredSection,
      message: `Section ${requiredSection} is missing coverage area "${area}".`,
    }),
  );
}

function validatePlanTaskCoverage(
  markdown: string,
  track: string | null,
): EngineeringCoverageValidationError[] {
  const errors: EngineeringCoverageValidationError[] = [];
  const planTrack = normalizeTrack(track);

  for (const task of parseTaskBlocks(markdown)) {
    const taskType = (task.fields["type"] ?? "").trim().toUpperCase();
    if (taskType !== "IMPLEMENT") {
      continue;
    }
    const taskTrack = normalizeTrack(task.fields["execution-track"]) ?? planTrack;
    if (!isCodeBearingTrack(taskTrack)) {
      continue;
    }
    if (!task.raw.toLowerCase().includes("engineering coverage")) {
      // i18n-exempt -- SKILL-2401 [ttl=2026-12-31] Internal validator error emitted in CLI JSON.
      errors.push({
        scope: "task",
        taskId: task.id,
        message: "Code/mixed IMPLEMENT task is missing an Engineering Coverage block.",
      });
      continue;
    }
    for (const area of ENGINEERING_COVERAGE_AREAS) {
      if (!includesCoverageArea(task.raw, area)) {
        errors.push({
          scope: "task",
          taskId: task.id,
          message: `Engineering Coverage block is missing area "${area}".`,
        });
      }
    }
  }

  return errors;
}

function normalizeArtifactType(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.trim().toLowerCase();
}

function normalizeTrack(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.trim().toLowerCase();
}

function isCodeBearingTrack(value: string | null | undefined): boolean {
  const normalized = normalizeTrack(value);
  return normalized === "code" || normalized === "mixed";
}

function includesCoverageArea(section: string, area: EngineeringCoverageArea): boolean {
  return section.toLowerCase().includes(area.toLowerCase());
}
