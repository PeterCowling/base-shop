/**
 * Startup Loop Artifact Contract Lint
 *
 * Validates that startup-loop artifact file paths conform to the canonical
 * path contracts defined in SKILL.md. Deterministic, pure-function, no I/O.
 *
 * Canonical paths:
 *   DEP:                  docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md
 *   Measurement verify:   docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md
 *
 * Task: TASK-12 (startup-loop-marketing-sales-capability-gap-audit)
 */

export interface ArtifactContractIssue {
  code: string;
  message: string;
  severity?: "error" | "warning";
}

export interface ArtifactLintOptions {
  /** Absolute or repo-relative file path to validate. */
  filePath: string;
}

export interface BriefingContractLintArtifact {
  /** Repo-relative artifact path (used in issue messages). */
  artifactPath: string;
  /** Parsed frontmatter/contract fields for linting. */
  fields: Record<string, unknown>;
  /** Expected business code from compile slot (for contamination checks). */
  expectedBusiness?: string;
}

export interface BriefingContractLintOptions {
  artifacts: BriefingContractLintArtifact[];
  contradictionMode?: "warn_preflight" | "hard_fail";
  statusMode?: "warn_preflight" | "hard_fail";
}

const REQUIRED_BRIEFING_FIELDS = [
  "business",
  "artifact",
  "status",
  "owner",
  "last_updated",
  "source_of_truth",
  "depends_on",
  "decisions",
] as const;

const CANONICAL_STATUSES = new Set(["Draft", "Active", "Frozen", "Superseded"]);

const LEGACY_STATUS_MAP: Record<string, "Draft" | "Active" | "Frozen" | "Superseded"> = {
  Locked: "Frozen",
  Resolved: "Active",
  Current: "Active",
  Deprecated: "Superseded",
  Archived: "Superseded",
};

const CONTRADICTION_KEYS = [
  "primary_channel_surface",
  "primary_icp",
  "hero_sku_price_corridor",
  "claim_confidence",
] as const;

function modeToSeverity(
  mode: "warn_preflight" | "hard_fail",
): "warning" | "error" {
  return mode === "warn_preflight" ? "warning" : "error";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizeContradictionValue(key: string, value: unknown): string {
  if (key === "hero_sku_price_corridor" && isPlainObject(value)) {
    const currency = value.currency;
    const min = value.min;
    const max = value.max;
    if (
      typeof currency === "string" &&
      typeof min === "number" &&
      typeof max === "number"
    ) {
      return `${currency}:${min}-${max}`;
    }
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return stableStringify(value);
}

/**
 * Identify the startup-loop artifact type from its filename.
 * Returns null if the file is not a known startup-loop contract artifact.
 */
export function classifyArtifactType(
  filePath: string,
): "dep" | "measurement-verification" | null {
  const normalized = filePath.replace(/\\/g, "/");
  if (/demand-evidence-pack\.md$/.test(normalized)) return "dep";
  if (/measurement-verification[^/]*\.user\.md$/.test(normalized))
    return "measurement-verification";
  return null;
}

/**
 * Validate the file path of a startup-loop artifact against its canonical contract.
 *
 * Detects path-contract violations:
 *   dep_wrong_path                    — DEP artifact is not in the canonical startup-baselines/<BIZ>/ directory
 *   measurement_verification_wrong_path — measurement-verification doc is not in strategy/<BIZ>/
 *
 * Returns an empty array when the path is compliant.
 */
export function lintStartupLoopArtifactPath(
  opts: ArtifactLintOptions,
): ArtifactContractIssue[] {
  const issues: ArtifactContractIssue[] = [];
  const normalized = opts.filePath.replace(/\\/g, "/");
  const type = classifyArtifactType(opts.filePath);

  if (type === "dep") {
    // Must be at: docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md
    // (exactly one path segment as the BIZ slug; no nested directories)
    const canonicalPattern =
      /docs\/business-os\/startup-baselines\/[^/]+\/demand-evidence-pack\.md$/;
    if (!canonicalPattern.test(normalized)) {
      issues.push({
        code: "dep_wrong_path",
        message:
          `demand-evidence-pack.md must be at ` +
          `docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md` +
          ` — found at: ${opts.filePath}`,
      });
    }
  }

  if (type === "measurement-verification") {
    // Must be at: docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md
    // (one BIZ path segment; filename may have date prefix or suffix)
    const canonicalPattern =
      /docs\/business-os\/strategy\/[^/]+\/[^/]*measurement-verification[^/]*\.user\.md$/;
    if (!canonicalPattern.test(normalized)) {
      issues.push({
        code: "measurement_verification_wrong_path",
        message:
          `measurement-verification doc must be at ` +
          `docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md` +
          ` — found at: ${opts.filePath}`,
      });
    }
  }

  return issues;
}

/**
 * Validate briefing metadata/status/contradiction contracts for startup-loop artifacts.
 *
 * Deterministic issue codes:
 * - missing_required_field
 * - invalid_status_taxonomy
 * - label_mismatch
 * - contradiction_conflict
 */
export function lintBriefingContract(
  opts: BriefingContractLintOptions,
): ArtifactContractIssue[] {
  const issues: ArtifactContractIssue[] = [];
  const contradictionMode = opts.contradictionMode ?? "hard_fail";
  const statusMode = opts.statusMode ?? "warn_preflight";
  const artifacts = [...opts.artifacts].sort((a, b) =>
    a.artifactPath.localeCompare(b.artifactPath),
  );

  for (const artifact of artifacts) {
    for (const field of REQUIRED_BRIEFING_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(artifact.fields, field)) {
        issues.push({
          code: "missing_required_field",
          severity: "error",
          message: `${artifact.artifactPath} missing required field '${field}'`,
        });
      }
    }

    const rawStatus =
      typeof artifact.fields.status === "string"
        ? artifact.fields.status.trim()
        : "";

    if (rawStatus.length > 0 && !CANONICAL_STATUSES.has(rawStatus)) {
      if (Object.prototype.hasOwnProperty.call(LEGACY_STATUS_MAP, rawStatus)) {
        const canonicalStatus = LEGACY_STATUS_MAP[rawStatus];
        issues.push({
          code: "invalid_status_taxonomy",
          severity: modeToSeverity(statusMode),
          message:
            `${artifact.artifactPath} uses legacy status '${rawStatus}' ` +
            `(map to '${canonicalStatus}')`,
        });
      } else {
        issues.push({
          code: "invalid_status_taxonomy",
          severity: "error",
          message:
            `${artifact.artifactPath} has invalid status '${rawStatus}' ` +
            `(allowed: Draft|Active|Frozen|Superseded)`,
        });
      }
    }

    if (artifact.expectedBusiness) {
      const business =
        typeof artifact.fields.business === "string"
          ? artifact.fields.business.trim()
          : "";

      if (business && business !== artifact.expectedBusiness) {
        issues.push({
          code: "label_mismatch",
          severity: "error",
          message:
            `${artifact.artifactPath} business '${business}' does not match ` +
            `expected slot '${artifact.expectedBusiness}'`,
        });
      }
    }
  }

  const sourceOfTruthArtifacts = artifacts.filter(
    (artifact) => artifact.fields.source_of_truth === true,
  );

  for (const key of CONTRADICTION_KEYS) {
    const values = new Map<string, string[]>();

    for (const artifact of sourceOfTruthArtifacts) {
      const rawValue = artifact.fields[key];
      if (
        rawValue === undefined ||
        rawValue === null ||
        (typeof rawValue === "string" && rawValue.trim().length === 0)
      ) {
        continue;
      }

      const normalizedValue = normalizeContradictionValue(key, rawValue);
      const paths = values.get(normalizedValue) ?? [];
      paths.push(artifact.artifactPath);
      values.set(normalizedValue, paths);
    }

    if (values.size > 1) {
      const details = [...values.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([value, paths]) => {
          const sortedPaths = [...paths].sort((a, b) => a.localeCompare(b));
          return `${key}=${value} @ ${sortedPaths.join(",")}`;
        })
        .join(" | ");

      issues.push({
        code: "contradiction_conflict",
        severity: modeToSeverity(contradictionMode),
        message:
          `contradiction on '${key}' across source_of_truth artifacts: ${details}`,
      });
    }
  }

  return issues;
}
