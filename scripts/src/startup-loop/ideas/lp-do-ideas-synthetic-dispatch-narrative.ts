import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  buildNarrativeHints,
  DEFAULT_TRANSCRIPTS_ROOT,
  parseSessionFile,
  type SessionFinding,
} from "./lp-do-ideas-agent-session-bridge.js";
import type { IntendedOutcomeV2 } from "./lp-do-ideas-trial.js";

const ACRONYM_WORDS = new Set(["api", "ci", "cms", "gtm", "ops", "qa", "seo", "ui", "ux"]);
const GENERIC_PATH_SEGMENTS = new Set([
  "app",
  "apps",
  "src",
  "lib",
  "tests",
  "test",
  "__tests__",
  "__mocks__",
  "components",
  "hooks",
  "utils",
  "pages",
  "layouts",
  "route",
  "page",
  "layout",
  "[lang]",
]);

export const SYNTHETIC_DISPATCH_ARTIFACT_SUFFIXES = [
  "-BOS-BUG_SCAN_FINDINGS",
  "-BOS-CODEBASE_STRUCTURAL_SIGNALS",
  "-BOS-REPO_MATURITY_SIGNALS",
  "-BOS-AGENT_SESSION_FINDINGS",
] as const;

export interface SyntheticDispatchLike {
  artifact_id?: unknown;
  area_anchor?: unknown;
  current_truth?: unknown;
  next_scope_now?: unknown;
  why?: unknown;
  evidence_refs?: unknown;
  intended_outcome?: unknown;
}

export interface SyntheticDispatchNarrative {
  kind: "agent_session" | "codebase_structural" | "repo_maturity";
  area_anchor: string;
  current_truth: string;
  next_scope_now: string;
  why: string;
  intended_outcome: IntendedOutcomeV2;
}

export interface SyntheticDispatchNarrativeOptions {
  rootDir: string;
  transcriptsRoot?: string;
}

export interface SyntheticDispatchBackfillResult<TDispatch extends SyntheticDispatchLike> {
  changed: boolean;
  changed_fields: string[];
  dispatch: TDispatch;
  narrative?: SyntheticDispatchNarrative;
}

interface AgentSessionArtifactShape {
  findings?: SessionFinding[];
}

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseEvidenceRefs(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function titleCaseWord(word: string): string {
  const lower = word.toLowerCase();
  if (ACRONYM_WORDS.has(lower)) {
    return lower.toUpperCase();
  }
  return lower.slice(0, 1).toUpperCase() + lower.slice(1);
}

function titleCasePhrase(value: string): string {
  return value
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map(titleCaseWord)
    .join(" ");
}

function humanizeToken(value: string): string {
  const normalized = value
    .replace(/\.(test|spec)\.[^.]+$/i, "")
    .replace(/\.[^.]+$/i, "")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return normalized;
}

function isSyntheticDispatchArtifactId(artifactId: string): boolean {
  return SYNTHETIC_DISPATCH_ARTIFACT_SUFFIXES.some((suffix) => artifactId.endsWith(suffix));
}

export function isSyntheticDispatch(dispatch: SyntheticDispatchLike): boolean {
  return isSyntheticDispatchArtifactId(sanitizeText(dispatch.artifact_id));
}

function isAgentSessionSyntheticDispatch(dispatch: SyntheticDispatchLike): boolean {
  return sanitizeText(dispatch.artifact_id).endsWith("-BOS-AGENT_SESSION_FINDINGS");
}

function isGenericSyntheticAreaAnchor(dispatch: SyntheticDispatchLike): boolean {
  const value = sanitizeText(dispatch.area_anchor).toLowerCase();
  return (
    value.length === 0 ||
    value === "bos-agent-session-findings" ||
    value === "bos-codebase-structural-signals" ||
    value === "bos-repo-maturity-signals" ||
    value === "bos-bug-scan-findings"
  );
}

function isGenericSyntheticCurrentTruth(dispatch: SyntheticDispatchLike): boolean {
  const artifactId = sanitizeText(dispatch.artifact_id);
  const currentTruth = sanitizeText(dispatch.current_truth);
  if (!artifactId || !currentTruth) {
    return currentTruth.length === 0;
  }
  return currentTruth.startsWith(`${artifactId} changed (`) && currentTruth.endsWith(")");
}

function isGenericSyntheticNextScope(dispatch: SyntheticDispatchLike): boolean {
  const value = sanitizeText(dispatch.next_scope_now);
  return value.length === 0 || /^Investigate implications of .+ delta for /i.test(value);
}

function isGenericSyntheticWhy(dispatch: SyntheticDispatchLike): boolean {
  const value = sanitizeText(dispatch.why);
  return value.length === 0 || /^Assess .+ implications from .+ delta for .+\.$/i.test(value);
}

function isGenericSyntheticIntendedOutcome(dispatch: SyntheticDispatchLike): boolean {
  const intendedOutcome = dispatch.intended_outcome;
  if (!intendedOutcome || typeof intendedOutcome !== "object" || Array.isArray(intendedOutcome)) {
    return true;
  }
  const statement = sanitizeText(
    (intendedOutcome as { statement?: unknown }).statement,
  );
  return (
    statement.length === 0 ||
    /^Produce a validated routing outcome and scoped next action for /i.test(statement)
  );
}

function shouldRefreshProjectedAgentSessionNarrative(dispatch: SyntheticDispatchLike): boolean {
  if (!isAgentSessionSyntheticDispatch(dispatch)) {
    return false;
  }
  const currentTruth = sanitizeText(dispatch.current_truth);
  return (
    currentTruth.startsWith("Recent agent-session review surfaced") ||
    currentTruth.startsWith("Recent agent-session reviews surfaced")
  );
}

function formatList(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function resolveOptionalPath(rootDir: string, maybeAbsoluteOrRelativePath: string): string {
  return path.isAbsolute(maybeAbsoluteOrRelativePath)
    ? maybeAbsoluteOrRelativePath
    : path.join(rootDir, maybeAbsoluteOrRelativePath);
}

function loadAgentSessionArtifactFindings(
  rootDir: string,
  evidenceRefs: readonly string[],
): SessionFinding[] {
  const artifactRef = evidenceRefs.find((entry) => entry.startsWith("agent-session-artifact:"));
  if (!artifactRef) {
    return [];
  }
  const artifactPath = artifactRef.slice("agent-session-artifact:".length).trim();
  if (!artifactPath) {
    return [];
  }
  const absolutePath = resolveOptionalPath(rootDir, artifactPath);
  if (!existsSync(absolutePath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(absolutePath, "utf8")) as AgentSessionArtifactShape;
    return Array.isArray(parsed.findings) ? parsed.findings : [];
  } catch {
    return [];
  }
}

function collectAgentSessionFindings(
  dispatch: SyntheticDispatchLike,
  options: SyntheticDispatchNarrativeOptions,
): SessionFinding[] {
  const evidenceRefs = parseEvidenceRefs(dispatch.evidence_refs);
  const sessionIds = evidenceRefs
    .filter((entry) => entry.startsWith("session:"))
    .map((entry) => entry.slice("session:".length).trim())
    .filter((entry) => entry.length > 0);

  const findingsBySession = new Map<string, SessionFinding>();
  const transcriptsRoot = options.transcriptsRoot ?? DEFAULT_TRANSCRIPTS_ROOT;
  for (const sessionId of sessionIds) {
    const transcriptPath = path.join(transcriptsRoot, `${sessionId}.jsonl`);
    if (!existsSync(transcriptPath)) {
      continue;
    }
    const parsed = parseSessionFile(transcriptPath);
    if (parsed) {
      findingsBySession.set(sessionId, parsed);
    }
  }

  const artifactFindings = loadAgentSessionArtifactFindings(options.rootDir, evidenceRefs);
  for (const artifactFinding of artifactFindings) {
    if (sessionIds.length > 0 && !sessionIds.includes(artifactFinding.session_id)) {
      continue;
    }
    if (!findingsBySession.has(artifactFinding.session_id)) {
      findingsBySession.set(artifactFinding.session_id, artifactFinding);
    }
  }

  const ordered = sessionIds
    .map((sessionId) => findingsBySession.get(sessionId))
    .filter((entry): entry is SessionFinding => Boolean(entry));
  if (ordered.length > 0) {
    return ordered;
  }
  return artifactFindings.slice(0, 6);
}

function projectAgentSessionNarrative(
  dispatch: SyntheticDispatchLike,
  options: SyntheticDispatchNarrativeOptions,
): SyntheticDispatchNarrative {
  const findings = collectAgentSessionFindings(dispatch, options);
  if (findings.length === 0) {
    const sessionRefs = parseEvidenceRefs(dispatch.evidence_refs).filter((entry) =>
      entry.startsWith("session:"),
    );
    const sessionCount = sessionRefs.length;
    return {
      kind: "agent_session",
      area_anchor:
        sessionCount > 0
          ? `agent-session findings across ${sessionCount} review sessions`
          : "agent-session findings awaiting rehydration",
      current_truth:
        sessionCount > 0
          ? `Synthetic agent-session intake references ${sessionCount} review sessions, but the concrete findings need to be rehydrated from transcript evidence.`
          : "Synthetic agent-session intake exists, but the concrete findings were not preserved in the queue packet.",
      next_scope_now:
        "Rehydrate the referenced review sessions, extract the concrete findings, and then split real follow-up work from incidental review chatter.",
      why:
        "Agent-session monitoring is legitimate, but downstream queue items are not useful when the packet no longer carries the concrete findings that triggered it.",
      intended_outcome: {
        type: "operational",
        statement:
          "Produce concrete, evidence-backed next actions for the referenced agent-session findings.",
        source: "auto",
      },
    };
  }

  const hints = buildNarrativeHints(findings);
  return {
    kind: "agent_session",
    area_anchor: sanitizeText(hints.area_anchor_hint),
    current_truth: sanitizeText(hints.current_truth_hint),
    next_scope_now: sanitizeText(hints.next_scope_now_hint),
    why: sanitizeText(hints.why_hint),
    intended_outcome: hints.intended_outcome_hint as IntendedOutcomeV2,
  };
}

function summarizeCodebaseLabel(filePath: string): string {
  const segments = filePath.split("/").filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return "repo surface";
  }

  let scope = humanizeToken(segments[0] ?? "repo");
  let relevant = segments.slice(1);
  if ((segments[0] === "apps" || segments[0] === "packages") && segments[1]) {
    scope = humanizeToken(segments[1]);
    relevant = segments.slice(2);
  }

  const semantic = relevant
    .map((segment) => humanizeToken(segment))
    .find((segment) => segment.length > 0 && !GENERIC_PATH_SEGMENTS.has(segment));
  const basenameStem = humanizeToken(path.basename(filePath));
  const labelParts = [titleCasePhrase(scope)];
  if (semantic) {
    labelParts.push(semantic);
  } else if (basenameStem) {
    labelParts.push(basenameStem);
  }
  return labelParts.join(" ").trim();
}

function projectCodebaseStructuralNarrative(
  dispatch: SyntheticDispatchLike,
): SyntheticDispatchNarrative {
  const changedFiles = parseEvidenceRefs(dispatch.evidence_refs)
    .filter((entry) => entry.startsWith("git-diff:"))
    .map((entry) => entry.split(":").slice(2).join(":").trim())
    .filter((entry) => entry.length > 0);

  const labelCounts = new Map<string, number>();
  for (const filePath of changedFiles) {
    const label = summarizeCodebaseLabel(filePath);
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }

  const rankedLabels = Array.from(labelCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3);
  const summaryLabels = rankedLabels.map(([label, count]) =>
    count > 1 ? `${label} (${count} files)` : label,
  );
  const primaryLabel = rankedLabels[0]?.[0] ?? "codebase structural changes";
  const topAreas = rankedLabels.map(([label]) => label);

  return {
    kind: "codebase_structural",
    area_anchor: `${primaryLabel} structural changes`,
    current_truth:
      summaryLabels.length > 0
        ? `Recent codebase structural changes touched ${formatList(summaryLabels)}.`
        : "Recent codebase structural changes need a better surface-level summary.",
    next_scope_now:
      topAreas.length > 0
        ? `Review the touched surfaces in ${formatList(topAreas.slice(0, 3))} and turn any implicit follow-up work into concrete scoped items.`
        : "Review the changed files and convert any structural follow-up work into concrete scoped items.",
    why:
      "The codebase signals bridge detected a concentrated set of file changes that should remain attached to the affected surfaces instead of sitting in the queue as a generic structural delta.",
    intended_outcome: {
      type: "operational",
      statement:
        "Produce concrete follow-up work for the affected codebase surfaces, or explicitly close the structural signal as a no-op.",
      source: "auto",
    },
  };
}

function collectPrefixedValues(evidenceRefs: readonly string[], prefix: string): string[] {
  return evidenceRefs
    .filter((entry) => entry.startsWith(prefix))
    .map((entry) => entry.slice(prefix.length).trim())
    .filter((entry) => entry.length > 0);
}

function projectRepoMaturityNarrative(dispatch: SyntheticDispatchLike): SyntheticDispatchNarrative {
  const evidenceRefs = parseEvidenceRefs(dispatch.evidence_refs);
  const score = collectPrefixedValues(evidenceRefs, "repo-maturity-score:")[0] ?? "unknown";
  const level = collectPrefixedValues(evidenceRefs, "repo-maturity-level:")[0] ?? "unknown";
  const scoreDelta = collectPrefixedValues(evidenceRefs, "repo-maturity-score-delta:")[0];
  const capReasons = collectPrefixedValues(evidenceRefs, "repo-maturity-cap-reason:")
    .map(humanizeToken)
    .map(titleCasePhrase);
  const criticalControls = collectPrefixedValues(evidenceRefs, "repo-maturity-critical-control:")
    .map(humanizeToken);
  const criticalControlsSummary = criticalControls.slice(0, 3);

  const scoreClause =
    scoreDelta && !Number.isNaN(Number(scoreDelta))
      ? `Repo maturity is ${score} (${level}), ${Number(scoreDelta) >= 0 ? `up ${scoreDelta}` : `down ${Math.abs(Number(scoreDelta))}`} points`
      : `Repo maturity is ${score} (${level})`;
  const controlClause =
    criticalControlsSummary.length > 0
      ? ` with critical controls missing: ${formatList(criticalControlsSummary)}`
      : "";
  const capClause =
    capReasons.length > 0
      ? ` Current strictness cap reasons: ${formatList(capReasons.slice(0, 3))}.`
      : "";

  return {
    kind: "repo_maturity",
    area_anchor:
      criticalControlsSummary.length > 0
        ? `repo maturity controls missing: ${formatList(criticalControlsSummary)}`
        : "repo maturity regression needs remediation",
    current_truth: `${scoreClause}${controlClause}.${capClause}`,
    next_scope_now:
      criticalControlsSummary.length > 0 || capReasons.length > 0
        ? `Close the missing repo controls (${formatList(criticalControlsSummary) || "recorded controls"}) and address any strictness-cap reasons before treating this repo as higher-assurance.`
        : "Review the repo maturity regression and turn the missing controls into concrete remediation work.",
    why:
      "Repo maturity monitoring is only useful when missing controls and cap reasons are surfaced as concrete remediation work rather than a generic monitoring stub.",
    intended_outcome: {
      type: "operational",
      statement:
        "Produce a concrete remediation path for the missing repo-maturity controls and any current strictness cap reasons.",
      source: "auto",
    },
  };
}

export function projectSyntheticDispatchNarrative(
  dispatch: SyntheticDispatchLike,
  options: SyntheticDispatchNarrativeOptions,
): SyntheticDispatchNarrative | null {
  const artifactId = sanitizeText(dispatch.artifact_id);
  if (!artifactId || !isSyntheticDispatchArtifactId(artifactId)) {
    return null;
  }
  if (artifactId.endsWith("-BOS-AGENT_SESSION_FINDINGS")) {
    return projectAgentSessionNarrative(dispatch, options);
  }
  if (artifactId.endsWith("-BOS-CODEBASE_STRUCTURAL_SIGNALS")) {
    return projectCodebaseStructuralNarrative(dispatch);
  }
  if (artifactId.endsWith("-BOS-REPO_MATURITY_SIGNALS")) {
    return projectRepoMaturityNarrative(dispatch);
  }
  return null;
}

export function backfillSyntheticDispatch<TDispatch extends SyntheticDispatchLike>(
  dispatch: TDispatch,
  options: SyntheticDispatchNarrativeOptions,
): SyntheticDispatchBackfillResult<TDispatch> {
  const narrative = projectSyntheticDispatchNarrative(dispatch, options);
  if (!narrative) {
    return { changed: false, changed_fields: [], dispatch };
  }

  const nextDispatch = { ...dispatch };
  const changedFields: string[] = [];
  const refreshAgentSessionProjection = shouldRefreshProjectedAgentSessionNarrative(dispatch);
  const currentIntendedOutcome = JSON.stringify(dispatch.intended_outcome ?? null);
  const nextIntendedOutcome = JSON.stringify(narrative.intended_outcome);
  if (isGenericSyntheticAreaAnchor(dispatch) || refreshAgentSessionProjection) {
    if (sanitizeText(dispatch.area_anchor) !== narrative.area_anchor) {
      nextDispatch.area_anchor = narrative.area_anchor;
      changedFields.push("area_anchor");
    }
  }
  if (
    (isGenericSyntheticCurrentTruth(dispatch) || refreshAgentSessionProjection) &&
    sanitizeText(dispatch.current_truth) !== narrative.current_truth
  ) {
    nextDispatch.current_truth = narrative.current_truth;
    changedFields.push("current_truth");
  }
  if (
    (isGenericSyntheticNextScope(dispatch) || refreshAgentSessionProjection) &&
    sanitizeText(dispatch.next_scope_now) !== narrative.next_scope_now
  ) {
    nextDispatch.next_scope_now = narrative.next_scope_now;
    changedFields.push("next_scope_now");
  }
  if (
    (isGenericSyntheticWhy(dispatch) || refreshAgentSessionProjection) &&
    sanitizeText(dispatch.why) !== narrative.why
  ) {
    nextDispatch.why = narrative.why;
    changedFields.push("why");
  }
  if (
    (isGenericSyntheticIntendedOutcome(dispatch) || refreshAgentSessionProjection) &&
    currentIntendedOutcome !== nextIntendedOutcome
  ) {
    nextDispatch.intended_outcome = narrative.intended_outcome;
    changedFields.push("intended_outcome");
  }

  return {
    changed: changedFields.length > 0,
    changed_fields: changedFields,
    dispatch: nextDispatch,
    narrative,
  };
}
