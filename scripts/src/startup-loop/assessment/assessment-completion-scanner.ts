import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";

import { parseFrontmatterDate } from "../baselines/baselines-freshness";

export type AssessmentStageStatus =
  | "complete"
  | "not_found"
  | "no_artifact_pattern";

export interface AssessmentCompletionResult {
  business: string;
  stage_id: string;
  stage_name: string;
  status: AssessmentStageStatus;
  artifact_path: string | null;
  artifact_date: string | null;
  conditional: boolean;
}

export interface AssessmentCompletionOptions {
  strategyRoot: string;
  businesses?: string[];
  nowMs?: number;
}

type StageSearchLocation = "assessment_root" | "naming_workbench";

interface StagePattern {
  type: "exact" | "suffix" | "contains_suffix";
  value: string;
  requiredSuffix?: string;
}

interface StageDefinition {
  stage_id: string;
  stage_name: string;
  conditional: boolean;
  statusOverride?: AssessmentStageStatus;
  patterns: Array<{
    location: StageSearchLocation;
    pattern: StagePattern;
  }>;
}

interface CandidateArtifact {
  absolutePath: string;
  relativePath: string;
  fileName: string;
  filenameDate: string | null;
}

export const STAGE_PATTERNS: readonly StageDefinition[] = [
  {
    stage_id: "ASSESSMENT-01",
    stage_name: "Problem Statement",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "problem-statement.user.md" },
      },
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "problem-framing.user.md" },
      },
      {
        location: "assessment_root",
        pattern: { type: "exact", value: "current-problem-framing.user.md" },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-02",
    stage_name: "Solution Profiling",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "solution-profile-results.user.md" },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-03",
    stage_name: "Solution Selection",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "solution-decision.user.md" },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-04",
    stage_name: "Naming Candidate Generation",
    conditional: false,
    patterns: [
      {
        location: "naming_workbench",
        pattern: {
          type: "contains_suffix",
          value: "candidate-names",
          requiredSuffix: ".user.md",
        },
      },
      {
        location: "naming_workbench",
        pattern: {
          type: "contains_suffix",
          value: "naming-shortlist",
          requiredSuffix: ".user.md",
        },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-05",
    stage_name: "Name Selection Spec",
    conditional: true,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "exact", value: "name-selection-spec.md" },
      },
      {
        location: "naming_workbench",
        pattern: {
          type: "contains_suffix",
          value: "naming-generation-spec",
          requiredSuffix: ".md",
        },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-06",
    stage_name: "Distribution Profiling",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "launch-distribution-plan.user.md" },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-07",
    stage_name: "Measurement Profiling",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "measurement-profile.user.md" },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-08",
    stage_name: "Current Situation",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "operator-context.user.md" },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-09",
    stage_name: "Intake",
    conditional: false,
    statusOverride: "no_artifact_pattern",
    patterns: [],
  },
  {
    stage_id: "ASSESSMENT-10",
    stage_name: "Brand Profiling",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "brand-profile.user.md" },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-11",
    stage_name: "Brand Identity",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "brand-identity-dossier.user.md" },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-13",
    stage_name: "Product Naming",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "product-naming.user.md" },
      },
      {
        location: "naming_workbench",
        pattern: {
          type: "contains_suffix",
          value: "product-naming",
          requiredSuffix: ".user.md",
        },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-14",
    stage_name: "Logo Brief",
    conditional: false,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "logo-brief.user.md" },
      },
    ],
  },
  {
    stage_id: "ASSESSMENT-15",
    stage_name: "Packaging Brief",
    conditional: true,
    patterns: [
      {
        location: "assessment_root",
        pattern: { type: "suffix", value: "packaging-brief.user.md" },
      },
    ],
  },
];

export function scanAssessmentCompletion(
  options: AssessmentCompletionOptions
): AssessmentCompletionResult[] {
  const { strategyRoot, businesses, nowMs = Date.now() } = options;
  void nowMs;

  const businessIds = resolveBusinesses(strategyRoot, businesses);
  if (businessIds.length === 0) {
    return [];
  }

  const results: AssessmentCompletionResult[] = [];

  for (const business of businessIds) {
    const assessmentRoot = path.join(strategyRoot, business, "assessment");
    const namingWorkbenchRoot = path.join(assessmentRoot, "naming-workbench");

    const rootFiles = listScannableFiles(assessmentRoot);
    const workbenchFiles = listScannableFiles(namingWorkbenchRoot);

    for (const stage of STAGE_PATTERNS) {
      if (stage.statusOverride === "no_artifact_pattern") {
        results.push({
          business,
          stage_id: stage.stage_id,
          stage_name: stage.stage_name,
          status: "no_artifact_pattern",
          artifact_path: null,
          artifact_date: null,
          conditional: stage.conditional,
        });
        continue;
      }

      const matchingArtifacts = collectMatchingArtifacts(
        stage,
        strategyRoot,
        assessmentRoot,
        namingWorkbenchRoot,
        rootFiles,
        workbenchFiles
      );

      const selected = selectMostRecentArtifact(matchingArtifacts);

      if (!selected) {
        results.push({
          business,
          stage_id: stage.stage_id,
          stage_name: stage.stage_name,
          status: "not_found",
          artifact_path: null,
          artifact_date: null,
          conditional: stage.conditional,
        });
        continue;
      }

      results.push({
        business,
        stage_id: stage.stage_id,
        stage_name: stage.stage_name,
        status: "complete",
        artifact_path: selected.relativePath,
        artifact_date: deriveArtifactDate(selected),
        conditional: stage.conditional,
      });
    }
  }

  results.sort((a, b) => {
    if (a.business !== b.business) {
      return a.business.localeCompare(b.business);
    }
    return a.stage_id.localeCompare(b.stage_id);
  });

  return results;
}

function resolveBusinesses(
  strategyRoot: string,
  businesses?: string[]
): string[] {
  if (Array.isArray(businesses) && businesses.length > 0) {
    return [...new Set(businesses)].sort((a, b) => a.localeCompare(b));
  }

  if (!existsSync(strategyRoot)) {
    return [];
  }

  return readdirSync(strategyRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_templates")
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function listScannableFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  return readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => isScannableFile(fileName))
    .sort((a, b) => a.localeCompare(b));
}

function isScannableFile(fileName: string): boolean {
  if (!fileName.endsWith(".md")) {
    return false;
  }
  if (fileName.endsWith(".html")) {
    return false;
  }
  if (fileName.endsWith(".agent.md")) {
    return false;
  }
  return true;
}

function collectMatchingArtifacts(
  stage: StageDefinition,
  strategyRoot: string,
  assessmentRoot: string,
  namingWorkbenchRoot: string,
  rootFiles: string[],
  workbenchFiles: string[]
): CandidateArtifact[] {
  const artifacts: CandidateArtifact[] = [];

  for (const { location, pattern } of stage.patterns) {
    const filePool = location === "assessment_root" ? rootFiles : workbenchFiles;

    for (const fileName of filePool) {
      if (!matchesPattern(fileName, pattern)) {
        continue;
      }

      const absolutePath =
        location === "assessment_root"
          ? path.join(assessmentRoot, fileName)
          : path.join(namingWorkbenchRoot, fileName);

      artifacts.push({
        absolutePath,
        relativePath: normalizePath(path.relative(strategyRoot, absolutePath)),
        fileName,
        filenameDate: extractFilenameDate(fileName),
      });
    }
  }

  return artifacts;
}

function matchesPattern(fileName: string, pattern: StagePattern): boolean {
  if (pattern.type === "exact") {
    return fileName === pattern.value;
  }
  if (pattern.type === "suffix") {
    return fileName.endsWith(pattern.value);
  }
  const suffix = pattern.requiredSuffix ?? ".md";
  return fileName.includes(pattern.value) && fileName.endsWith(suffix);
}

function selectMostRecentArtifact(
  artifacts: CandidateArtifact[]
): CandidateArtifact | null {
  if (artifacts.length === 0) {
    return null;
  }

  const deduped = Array.from(
    new Map(artifacts.map((artifact) => [artifact.relativePath, artifact])).values()
  );

  deduped.sort((a, b) => {
    const aKey = a.filenameDate ?? "0000-00-00";
    const bKey = b.filenameDate ?? "0000-00-00";

    if (aKey !== bKey) {
      return bKey.localeCompare(aKey);
    }

    return b.fileName.localeCompare(a.fileName);
  });

  return deduped[0];
}

function deriveArtifactDate(candidate: CandidateArtifact): string | null {
  if (candidate.filenameDate) {
    return candidate.filenameDate;
  }

  const content = readFileSync(candidate.absolutePath, "utf-8");
  const frontmatterDate = parseFrontmatterDate(content);
  if (!frontmatterDate) {
    return null;
  }
  return Number.isNaN(Date.parse(frontmatterDate)) ? null : frontmatterDate;
}

function extractFilenameDate(fileName: string): string | null {
  const match = fileName.match(/^(\d{4}-\d{2}-\d{2})-/);
  return match ? match[1] : null;
}

function normalizePath(value: string): string {
  return value.split(path.sep).join("/");
}
