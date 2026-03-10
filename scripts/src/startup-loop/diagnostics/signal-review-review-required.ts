import { existsSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import { load as loadYaml } from "js-yaml";

import type { GapCase, Prescription } from "../self-evolving/self-evolving-contracts.js";
import {
  buildCanonicalGapCase,
  buildCanonicalPrescription,
  buildCompiledCandidateId,
  expectedArtifactsForRoute,
  normalizeCanonicalToken,
} from "../self-evolving/self-evolving-prescription-normalization.js";

const SIGNAL_REVIEW_REQUIRED_SCHEMA_VERSION = "signal-review.review-required.v1";
const DEFAULT_OWNER = "Pete";

export type ReviewRequiredWorkflowStatus = "open";
export type ReviewRequiredEscalationState = "repeat-open" | "escalated" | "overdue";

export interface SignalReviewReviewRequiredItem {
  fingerprint: string;
  business: string;
  title: string;
  body: string;
  owner: string;
  workflow_status: ReviewRequiredWorkflowStatus;
  due_date: string;
  escalation_state: ReviewRequiredEscalationState;
  recurrence_count: number;
  first_seen_run_date: string;
  latest_seen_run_date: string;
  source_signal_review_path: string;
  suggested_action: string;
  gap_case?: GapCase;
  prescription?: Prescription;
}

export interface SignalReviewReviewRequiredSidecar {
  schema_version: typeof SIGNAL_REVIEW_REQUIRED_SCHEMA_VERSION;
  generated_at: string;
  business: string;
  source_path: string;
  items: SignalReviewReviewRequiredItem[];
}

interface FrontmatterParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

interface FindingSection {
  title: string;
  body: string;
}

function normalizeNewlines(input: string): string {
  return input.replace(/\r\n?/g, "\n");
}

function parseFrontmatter(content: string): FrontmatterParseResult {
  const normalized = normalizeNewlines(content);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: {}, body: normalized };
  }

  let frontmatter: Record<string, unknown> = {};
  try {
    const parsed = loadYaml(match[1]);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      frontmatter = parsed as Record<string, unknown>;
    }
  } catch {
    frontmatter = {};
  }

  return {
    frontmatter,
    body: normalized.slice(match[0].length),
  };
}

function findFrontmatterString(frontmatter: Record<string, unknown>, key: string): string | null {
  const value = frontmatter[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function compareDateOnly(left: string, right: string): number {
  return left.localeCompare(right);
}

function extractFindingSections(markdownBody: string): FindingSection[] {
  const sections: FindingSection[] = [];
  const pattern = /^### Finding \d+: ([^\n]+)\n([\s\S]*?)(?=^### Finding \d+: |^## |\Z)/gm;
  let match: RegExpExecArray | null = pattern.exec(markdownBody);
  while (match) {
    const title = match[1]?.trim();
    const body = match[2]?.trim();
    if (title && body) {
      sections.push({ title, body });
    }
    match = pattern.exec(markdownBody);
  }
  return sections;
}

function extractField(block: string, label: string): string | null {
  const prefix = `- ${label}:`;
  for (const line of block.split("\n")) {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length).trim();
    }
  }
  return null;
}

function stripCodeTicks(value: string): string {
  return value.replace(/^`+|`+$/g, "").trim();
}

function extractSummaryNext(block: string): string | null {
  const match = block.match(/^- Next:\s*(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function extractWhyThisMatters(block: string): string | null {
  const match = block.match(/\*\*Why this matters\*\*:\s*([\s\S]*?)(?=\n\n\*\*Promotion stub\*\*|\Z)/);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

function listPriorSignalReviews(sourcePath: string): string[] {
  const directory = path.dirname(sourcePath);
  try {
    return readdirSync(directory)
      .filter((entry) => /^signal-review-.*\.md$/u.test(entry))
      .map((entry) => path.join(directory, entry))
      .sort();
  } catch {
    return [sourcePath];
  }
}

function extractRunDateFromMarkdown(content: string): string | null {
  const parsed = parseFrontmatter(content);
  const runDateRaw = findFrontmatterString(parsed.frontmatter, "Run-date");
  if (!runDateRaw) {
    return null;
  }
  if (/^\d{8}$/u.test(runDateRaw)) {
    return `${runDateRaw.slice(0, 4)}-${runDateRaw.slice(4, 6)}-${runDateRaw.slice(6, 8)}`;
  }
  return /^\d{4}-\d{2}-\d{2}$/u.test(runDateRaw) ? runDateRaw : null;
}

function collectOccurrenceDates(sourcePath: string, fingerprint: string): string[] {
  const matches: string[] = [];
  for (const candidatePath of listPriorSignalReviews(sourcePath)) {
    let raw: string;
    try {
      raw = readFileSync(candidatePath, "utf8");
    } catch {
      continue;
    }
    if (!raw.includes(fingerprint)) {
      continue;
    }
    const runDate = extractRunDateFromMarkdown(raw);
    if (runDate) {
      matches.push(runDate);
    }
  }
  return matches.sort(compareDateOnly);
}

function deriveEscalationState(
  occurrenceDates: readonly string[],
  status: string,
  dueDate: string,
  todayIso: string,
): ReviewRequiredEscalationState {
  if (compareDateOnly(dueDate, todayIso) < 0) {
    return "overdue";
  }
  if (occurrenceDates.length >= 3 || /escalated/i.test(status)) {
    return "escalated";
  }
  return "repeat-open";
}

function toRelativePath(repoRoot: string, filePath: string): string {
  const relative = path.relative(repoRoot, filePath);
  return relative.split(path.sep).join("/");
}

function deriveDueDate(
  latestSeenRunDate: string,
  occurrenceDates: readonly string[],
  status: string,
): string {
  if (occurrenceDates.length >= 3 || /escalated/i.test(status)) {
    return addDays(latestSeenRunDate, 3);
  }
  return addDays(latestSeenRunDate, 7);
}

function deriveSeverity(
  escalationState: ReviewRequiredEscalationState,
  recurrenceCount: number,
): number {
  const base =
    escalationState === "escalated" ? 0.8 : escalationState === "overdue" ? 0.85 : 0.6;
  const recurrenceBonus = Math.max(0, recurrenceCount - 2) * 0.05;
  return Math.min(0.95, base + recurrenceBonus);
}

function buildCanonicalSignalReviewFields(input: {
  business: string;
  fingerprint: string;
  title: string;
  recurrence_count: number;
  escalation_state: ReviewRequiredEscalationState;
  source_signal_review_path: string;
  suggested_action: string;
}): { gap_case: GapCase; prescription: Prescription } {
  const gapType = `signal_review_repeat_${normalizeCanonicalToken(input.fingerprint)}`;
  const candidateId = buildCompiledCandidateId({
    business_id: input.business,
    source_kind: "signal_review",
    recurrence_key: input.fingerprint,
    gap_type: gapType,
  });

  return {
    gap_case: buildCanonicalGapCase({
      business_id: input.business,
      source_kind: "signal_review",
      stage_id: null,
      capability_id: null,
      gap_type: gapType,
      reason_code: normalizeCanonicalToken(`repeat_${input.escalation_state}`),
      severity: deriveSeverity(input.escalation_state, input.recurrence_count),
      evidence_refs: [input.source_signal_review_path],
      recurrence_key: input.fingerprint,
      structural_context: {
        fingerprint: input.fingerprint,
        title: input.title,
        recurrence_count: input.recurrence_count,
        escalation_state: input.escalation_state,
        suggested_action: input.suggested_action,
        source_kind: "signal_review",
      },
      candidate_id: candidateId,
    }),
    prescription: buildCanonicalPrescription({
      prescription_family: "signal_review_manual_promotion_review",
      source: "signal_review",
      gap_types_supported: [gapType],
      required_route: "lp-do-fact-find",
      required_inputs: [input.source_signal_review_path, input.fingerprint],
      expected_artifacts: expectedArtifactsForRoute("lp-do-fact-find"),
      expected_signal_change:
        `Turn repeat signal-review finding ${input.fingerprint} into a validated next move or an explicit close rationale.`,
      risk_class: "low",
    }),
  };
}

export function extractSignalReviewRequiredItems(
  signalReviewPath: string,
  options: {
    repoRoot?: string;
    defaultOwner?: string;
    todayIso?: string;
  } = {},
): SignalReviewReviewRequiredSidecar | null {
  if (!existsSync(signalReviewPath)) {
    return null;
  }

  const repoRoot = options.repoRoot ?? process.cwd();
  const defaultOwner = options.defaultOwner?.trim() || DEFAULT_OWNER;
  const todayIso = options.todayIso ?? new Date().toISOString().slice(0, 10);

  const raw = readFileSync(signalReviewPath, "utf8");
  const parsed = parseFrontmatter(raw);
  const business = findFrontmatterString(parsed.frontmatter, "Business") ?? "BOS";
  const sourceRunDate = extractRunDateFromMarkdown(raw) ?? todayIso;

  const items: SignalReviewReviewRequiredItem[] = [];
  for (const finding of extractFindingSections(parsed.body)) {
    const fingerprintRaw = extractField(finding.body, "Fingerprint");
    const status = extractField(finding.body, "Status");
    if (!fingerprintRaw || !status || !/^REPEAT\b/u.test(status)) {
      continue;
    }

    const fingerprint = stripCodeTicks(fingerprintRaw);
    const occurrenceDates = collectOccurrenceDates(signalReviewPath, fingerprint);
    const recurrenceCount = Math.max(2, occurrenceDates.length);
    const latestSeenRunDate = occurrenceDates[occurrenceDates.length - 1] ?? sourceRunDate;
    const firstSeenRunDate = occurrenceDates[0] ?? sourceRunDate;
    const dueDate = deriveDueDate(latestSeenRunDate, occurrenceDates, status);
    const escalationState = deriveEscalationState(occurrenceDates, status, dueDate, todayIso);
    const whyThisMatters = extractWhyThisMatters(finding.body) ?? "Repeated Signal Review finding requires manual operator review.";
    const nextAction =
      extractSummaryNext(finding.body) ??
      `Review ${fingerprint} and decide whether to promote it into a fact-find or close it with rationale.`;
    const relativeSourcePath = toRelativePath(repoRoot, signalReviewPath);
    const canonical = buildCanonicalSignalReviewFields({
      business,
      fingerprint,
      title: finding.title,
      recurrence_count: recurrenceCount,
      escalation_state: escalationState,
      source_signal_review_path: relativeSourcePath,
      suggested_action: nextAction,
    });

    items.push({
      fingerprint,
      business,
      title: finding.title,
      body: whyThisMatters,
      owner: defaultOwner,
      workflow_status: "open",
      due_date: dueDate,
      escalation_state: escalationState,
      recurrence_count: recurrenceCount,
      first_seen_run_date: firstSeenRunDate,
      latest_seen_run_date: latestSeenRunDate,
      source_signal_review_path: relativeSourcePath,
      suggested_action: nextAction,
      gap_case: canonical.gap_case,
      prescription: canonical.prescription,
    });
  }

  return {
    schema_version: SIGNAL_REVIEW_REQUIRED_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    business,
    source_path: toRelativePath(repoRoot, signalReviewPath),
    items,
  };
}

export function writeSignalReviewRequiredSidecar(
  signalReviewPath: string,
  options: {
    repoRoot?: string;
    defaultOwner?: string;
    todayIso?: string;
  } = {},
): SignalReviewReviewRequiredSidecar | null {
  const sidecar = extractSignalReviewRequiredItems(signalReviewPath, options);
  if (!sidecar) {
    return null;
  }

  const sidecarPath = signalReviewPath.replace(/\.md$/u, ".review-required.json");
  const tmpPath = `${sidecarPath}.tmp`;
  try {
    writeFileSync(tmpPath, `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
    renameSync(tmpPath, sidecarPath);
  } catch (error) {
    try {
      unlinkSync(tmpPath);
    } catch {
      // Ignore temp cleanup failures.
    }
    throw error;
  }

  return sidecar;
}

function parseCliArgs(argv: readonly string[]): {
  signalReviewPath: string | null;
  owner: string | null;
  repoRoot: string;
} {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current?.startsWith("--")) {
      continue;
    }
    const key = current.slice(2);
    const value = argv[index + 1];
    if (value && !value.startsWith("--")) {
      flags.set(key, value);
      index += 1;
    } else {
      flags.set(key, "true");
    }
  }

  return {
    signalReviewPath: flags.get("signal-review") ?? null,
    owner: flags.get("owner") ?? null,
    repoRoot: flags.get("root-dir") ?? process.cwd(),
  };
}

if (process.argv[1]?.includes("signal-review-review-required")) {
  const args = parseCliArgs(process.argv.slice(2));
  if (!args.signalReviewPath) {
    process.stderr.write(
      "Usage: pnpm exec tsx scripts/src/startup-loop/diagnostics/signal-review-review-required.ts --signal-review <path> [--owner Pete] [--root-dir .]\n",
    );
    process.exit(1);
  }

  const absoluteSignalReviewPath = path.isAbsolute(args.signalReviewPath)
    ? args.signalReviewPath
    : path.join(args.repoRoot, args.signalReviewPath);
  const sidecar = writeSignalReviewRequiredSidecar(absoluteSignalReviewPath, {
    repoRoot: args.repoRoot,
    defaultOwner: args.owner ?? undefined,
  });
  if (sidecar) {
    process.stdout.write(
      `[signal-review-review-required] wrote ${absoluteSignalReviewPath.replace(/\.md$/u, ".review-required.json")} (${sidecar.items.length} items)\n`,
    );
  }
}

export { SIGNAL_REVIEW_REQUIRED_SCHEMA_VERSION };
