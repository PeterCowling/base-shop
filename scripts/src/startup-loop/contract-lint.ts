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
}

export interface ArtifactLintOptions {
  /** Absolute or repo-relative file path to validate. */
  filePath: string;
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
