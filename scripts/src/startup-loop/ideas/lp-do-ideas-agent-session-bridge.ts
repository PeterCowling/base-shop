import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";

import { enqueueQueueDispatches } from "./lp-do-ideas-queue-admission.js";
import type { RegistryV2ArtifactEntry } from "./lp-do-ideas-registry-migrate-v1-v2.js";
import {
  type ArtifactDeltaEvent,
  runTrialOrchestrator,
  type TrialDispatchPacket,
} from "./lp-do-ideas-trial.js";

interface RegistryDocument {
  artifacts: RegistryV2ArtifactEntry[];
}

interface BridgeState {
  schema_version: "agent-session-signal-bridge.v1";
  updated_at: string;
  findings_hash: string | null;
}

export interface SessionFinding {
  session_id: string;
  transcript_path: string;
  updated_at: string;
  findings: string[];
}

interface AgentSessionFindingsArtifact {
  schema_version: "agent-session-findings.v1";
  generated_at: string;
  business: string;
  transcript_root: string;
  sessions_scanned: number;
  sessions_with_findings: number;
  findings: SessionFinding[];
}

interface TranscriptRecord {
  sessionId?: string;
  timestamp?: string;
  message?: {
    role?: string;
    content?: unknown;
  };
}

export interface AgentSessionSignalsBridgeOptions {
  rootDir: string;
  business: string;
  registryPath: string;
  queueStatePath: string;
  telemetryPath: string;
  statePath: string;
  artifactPath: string;
  transcriptsRoot: string;
  sessionLimit: number;
}

export interface AgentSessionSignalsBridgeResult {
  ok: boolean;
  sessions_scanned: number;
  sessions_with_findings: number;
  events_considered: number;
  events_admitted: number;
  dispatches_enqueued: number;
  suppressed: number;
  noop: number;
  warnings: string[];
  artifact_written?: string;
  error?: string;
}

const DEFAULT_REGISTRY_PATH = "docs/business-os/startup-loop/ideas/standing-registry.json";
const DEFAULT_QUEUE_STATE_PATH = "docs/business-os/startup-loop/ideas/trial/queue-state.json";
const DEFAULT_TELEMETRY_PATH = "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl";
const DEFAULT_STATE_PATH =
  "docs/business-os/startup-loop/ideas/trial/agent-session-signal-bridge-state.json";
const DEFAULT_ARTIFACT_PATH =
  "docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json";
export const DEFAULT_TRANSCRIPTS_ROOT = join(
  os.homedir(),
  ".claude",
  "projects",
  "-Users-petercowling-base-shop",
);

const INTENT_PATTERN =
  /(walk\s*through|manual\s*test|simulate|qa\b|audit|review|list\s+(?:any\s+)?(?:issues|bugs|problems)|find\s+bugs|broken\s+flow)/i;
const ISSUE_PATTERN =
  /(bug|issue|problem|broken|fails?|failing|error|missing|regression|cannot|can\'t|blocked|gap)/i;
const META_FINDING_PATTERN =
  /\b(let me|now let me|i don\'t know|from the skill description|wait\b|i\'ll\b|i need to check|pre-existing|the .* edit failed earlier|now run|operator[_ -]?ideas?|artifact deltas?|dispatch(?:es)?|queue items?|planning gaps?|existing backlog|operator_idea|target route|recommended route)\b/i;
const LOW_SIGNAL_FINDING_PATTERN =
  /(\|\s*#\s*\|\s*issue|\*\*|`|routing assessment|recommendation:|covers some ground|share the same codebase surface|material\?)/i;

function hashValue(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

function resolvePath(rootDir: string, relativeOrAbsolutePath: string): string {
  return relativeOrAbsolutePath.startsWith("/")
    ? relativeOrAbsolutePath
    : join(rootDir, relativeOrAbsolutePath);
}

function atomicWrite(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tempPath = join(
    dirname(filePath),
    `.${basename(filePath)}.tmp.${randomBytes(4).toString("hex")}`,
  );
  writeFileSync(tempPath, content, "utf8");
  renameSync(tempPath, filePath);
}

function parseArgs(argv: string[]): AgentSessionSignalsBridgeOptions {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (!token?.startsWith("--") || !value || value.startsWith("--")) {
      continue;
    }
    flags.set(token.slice(2), value);
    index += 1;
  }

  const limitRaw = Number(flags.get("session-limit") ?? "25");
  const sessionLimit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.floor(limitRaw), 1), 200)
    : 25;

  const defaultRootDir = process.cwd().endsWith(`${sep}scripts`)
    ? resolve(process.cwd(), "..")
    : process.cwd();

  return {
    rootDir: flags.get("root-dir") ?? defaultRootDir,
    business: flags.get("business") ?? "BOS",
    registryPath: flags.get("registry-path") ?? DEFAULT_REGISTRY_PATH,
    queueStatePath: flags.get("queue-state-path") ?? DEFAULT_QUEUE_STATE_PATH,
    telemetryPath: flags.get("telemetry-path") ?? DEFAULT_TELEMETRY_PATH,
    statePath: flags.get("state-path") ?? DEFAULT_STATE_PATH,
    artifactPath: flags.get("artifact-path") ?? DEFAULT_ARTIFACT_PATH,
    transcriptsRoot: flags.get("transcripts-root") ?? DEFAULT_TRANSCRIPTS_ROOT,
    sessionLimit,
  };
}

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function loadRegistry(rootDir: string, registryPath: string): RegistryDocument {
  const absolute = resolvePath(rootDir, registryPath);
  const parsed = readJsonFile<RegistryDocument>(absolute);
  if (!parsed || !Array.isArray(parsed.artifacts)) {
    throw new Error(`Invalid standing registry at ${registryPath}`);
  }
  return parsed;
}

function loadState(rootDir: string, statePath: string): BridgeState {
  const absolute = resolvePath(rootDir, statePath);
  const parsed = readJsonFile<BridgeState>(absolute);
  if (!parsed || parsed.schema_version !== "agent-session-signal-bridge.v1") {
    return {
      schema_version: "agent-session-signal-bridge.v1",
      updated_at: new Date(0).toISOString(),
      findings_hash: null,
    };
  }
  return parsed;
}

function writeState(rootDir: string, statePath: string, state: BridgeState): void {
  const absolute = resolvePath(rootDir, statePath);
  atomicWrite(absolute, `${JSON.stringify(state, null, 2)}\n`);
}

function hasRequiredArtifact(registry: RegistryDocument, artifactId: string): boolean {
  return registry.artifacts.some((entry) => entry.artifact_id === artifactId && entry.active);
}

function extractTextSegments(content: unknown): string[] {
  if (typeof content === "string") {
    return [content];
  }
  if (!Array.isArray(content)) {
    return [];
  }

  const segments: string[] = [];
  for (const item of content) {
    if (typeof item === "string") {
      segments.push(item);
      continue;
    }
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (record.type === "text" && typeof record.text === "string") {
      segments.push(record.text);
    }
  }
  return segments;
}

function normalizeFinding(raw: string): string {
  return raw
    .replace(/^[\s>*#`-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFindingsFromAssistantText(text: string): string[] {
  const findings: string[] = [];
  const seen = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    const bulletMatch = line.match(/^(?:\s*[-*]|\s*\d+\.)\s+(.+)$/);
    if (!bulletMatch) {
      continue;
    }
    const normalized = normalizeFinding(bulletMatch[1]);
    if (normalized.length < 24 || normalized.length > 240) {
      continue;
    }
    if (!ISSUE_PATTERN.test(normalized)) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    findings.push(normalized);
    if (findings.length >= 5) {
      return findings;
    }
  }

  if (findings.length > 0) {
    return findings;
  }

  const sentenceCandidates = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeFinding(sentence));

  for (const sentence of sentenceCandidates) {
    if (sentence.length < 40 || sentence.length > 240) {
      continue;
    }
    if (!ISSUE_PATTERN.test(sentence)) {
      continue;
    }
    const key = sentence.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    findings.push(sentence);
    if (findings.length >= 3) {
      break;
    }
  }

  return findings;
}

export function parseSessionFile(filePath: string): SessionFinding | null {
  const raw = readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);

  let sessionId = "unknown-session";
  let updatedAt = new Date(statSync(filePath).mtimeMs).toISOString();
  let hasRelevantIntent = false;
  const findings: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    let record: TranscriptRecord;
    try {
      record = JSON.parse(line) as TranscriptRecord;
    } catch {
      continue;
    }

    if (typeof record.sessionId === "string" && record.sessionId.length > 0) {
      sessionId = record.sessionId;
    }
    if (typeof record.timestamp === "string" && record.timestamp.length > 0) {
      updatedAt = record.timestamp;
    }

    const role = record.message?.role;
    const textSegments = extractTextSegments(record.message?.content);
    const mergedText = textSegments.join("\n");
    if (mergedText.length === 0) {
      continue;
    }

    if (role === "user" && INTENT_PATTERN.test(mergedText)) {
      hasRelevantIntent = true;
    }

    if (role !== "assistant") {
      continue;
    }

    for (const finding of extractFindingsFromAssistantText(mergedText)) {
      const key = finding.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      findings.push(finding);
      if (findings.length >= 5) {
        break;
      }
    }
  }

  if (!hasRelevantIntent || findings.length === 0) {
    return null;
  }

  return {
    session_id: sessionId,
    transcript_path: filePath,
    updated_at: updatedAt,
    findings,
  };
}

function listRecentSessionFiles(transcriptsRoot: string, sessionLimit: number): string[] {
  if (!existsSync(transcriptsRoot)) {
    return [];
  }

  const candidates = readdirSync(transcriptsRoot)
    .filter((name) => name.endsWith(".jsonl"))
    .map((name) => {
      const absolute = join(transcriptsRoot, name);
      return { path: absolute, mtimeMs: statSync(absolute).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .slice(0, sessionLimit)
    .map((entry) => entry.path);

  return candidates;
}

function deriveChangedSections(findings: SessionFinding[]): string[] {
  const sections = new Set<string>(["walkthrough finding", "testing issue"]);

  const joined = findings
    .flatMap((session) => session.findings)
    .join(" ")
    .toLowerCase();

  if (/(ux|ui|layout|usability|confusing)/i.test(joined)) {
    sections.add("ux gap");
  }
  if (/(broken flow|cannot|can\'t|fails|failing|blocked)/i.test(joined)) {
    sections.add("broken flow");
  }
  if (/(missing|not implemented|gap)/i.test(joined)) {
    sections.add("missing functionality");
  }

  return Array.from(sections);
}

function createArtifact(
  options: AgentSessionSignalsBridgeOptions,
  findings: SessionFinding[],
  sessionFiles: string[],
): AgentSessionFindingsArtifact {
  return {
    schema_version: "agent-session-findings.v1",
    generated_at: new Date().toISOString(),
    business: options.business,
    transcript_root: options.transcriptsRoot,
    sessions_scanned: sessionFiles.length,
    sessions_with_findings: findings.length,
    findings,
  };
}

function summarizeFindingForDisplay(finding: string, maxLength: number): string {
  const normalized = normalizeFinding(finding).replace(/[.;:,]+$/g, "");
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function selectActionableFindings(findings: readonly SessionFinding[]): string[] {
  const flattened = findings.flatMap((session) => session.findings);
  const actionable = flattened.filter(
    (finding) =>
      !META_FINDING_PATTERN.test(finding) && !LOW_SIGNAL_FINDING_PATTERN.test(finding),
  );
  const selected = actionable.length > 0 ? actionable : flattened;
  return selected.slice(0, 3);
}

export function buildNarrativeHints(
  findings: readonly SessionFinding[],
): Pick<
  ArtifactDeltaEvent,
  "area_anchor_hint" | "current_truth_hint" | "next_scope_now_hint" | "why_hint" | "intended_outcome_hint"
> {
  const actionableFindings = selectActionableFindings(findings).map((finding) =>
    summarizeFindingForDisplay(finding, 110),
  );
  const primaryFinding = actionableFindings[0];
  const findingSummary = actionableFindings.join("; ");

  if (!primaryFinding || findingSummary.length === 0) {
    return {
      area_anchor_hint: undefined,
      current_truth_hint: undefined,
      next_scope_now_hint: undefined,
      why_hint: undefined,
      intended_outcome_hint: undefined,
    };
  }

  return {
    area_anchor_hint: primaryFinding,
    current_truth_hint:
      actionableFindings.length === 1
        ? `Recent agent-session review surfaced: ${primaryFinding}.`
        : `Recent agent-session reviews surfaced ${actionableFindings.length} concrete findings: ${findingSummary}.`,
    next_scope_now_hint:
      actionableFindings.length === 1
        ? `Validate the reported finding and decide whether it should become a build, fact-find, or no-op: ${primaryFinding}.`
        : `Validate the surfaced findings and split concrete follow-up work from incidental review chatter: ${findingSummary}.`,
    why_hint:
      actionableFindings.length === 1
        ? "Recent walkthrough/testing activity surfaced a concrete issue that should retain its original session context in downstream idea intake."
        : "Recent walkthrough/testing activity surfaced multiple concrete findings that should be preserved as specific downstream work instead of a generic synthetic delta.",
    intended_outcome_hint: {
      type: "operational",
      statement:
        actionableFindings.length === 1
          ? "Produce a validated next action for the surfaced agent-session finding."
          : "Produce validated next actions for the surfaced agent-session findings and preserve their concrete evidence in downstream idea intake.",
      source: "auto",
    },
  };
}

function computeFindingsHash(findings: SessionFinding[]): string {
  const normalized = findings
    .map((entry) => ({
      session_id: entry.session_id,
      updated_at: entry.updated_at,
      findings: [...entry.findings].sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => left.session_id.localeCompare(right.session_id));

  return hashValue(JSON.stringify(normalized));
}

function enqueueDispatches(
  options: AgentSessionSignalsBridgeOptions,
  packets: TrialDispatchPacket[],
): number {
  return enqueueQueueDispatches({
    queueStatePath: resolvePath(options.rootDir, options.queueStatePath),
    telemetryPath: resolvePath(options.rootDir, options.telemetryPath),
    telemetryReason: "agent_session_signal_bridge",
    packets,
  }).appended;
}

function deriveEvent(
  options: AgentSessionSignalsBridgeOptions,
  state: BridgeState,
  findings: SessionFinding[],
): { event: ArtifactDeltaEvent | null; nextHash: string | null } {
  if (findings.length === 0) {
    return { event: null, nextHash: state.findings_hash };
  }

  const nextHash = computeFindingsHash(findings);
  if (state.findings_hash === nextHash) {
    return { event: null, nextHash: state.findings_hash };
  }

  const changedSections = deriveChangedSections(findings);
  const evidenceRefs = findings
    .slice(0, 6)
    .map((entry) => `session:${entry.session_id}`);
  const narrativeHints = buildNarrativeHints(findings);

  return {
    event: {
      artifact_id: `${options.business}-BOS-AGENT_SESSION_FINDINGS`,
      business: options.business,
      before_sha: state.findings_hash ?? "bootstrap",
      after_sha: nextHash,
      path: options.artifactPath,
      changed_sections: changedSections,
      updated_by_process: "agent-session-signal-bridge",
      material_delta: true,
      evidence_refs: [`agent-session-artifact:${options.artifactPath}`, ...evidenceRefs],
      ...narrativeHints,
    },
    nextHash,
  };
}

export function runAgentSessionSignalsBridge(
  options: AgentSessionSignalsBridgeOptions,
): AgentSessionSignalsBridgeResult {
  const warnings: string[] = [];

  let registry: RegistryDocument;
  try {
    registry = loadRegistry(options.rootDir, options.registryPath);
  } catch (error) {
    return {
      ok: false,
      sessions_scanned: 0,
      sessions_with_findings: 0,
      events_considered: 0,
      events_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const sessionFiles = listRecentSessionFiles(options.transcriptsRoot, options.sessionLimit);
  if (sessionFiles.length === 0) {
    return {
      ok: true,
      sessions_scanned: 0,
      sessions_with_findings: 0,
      events_considered: 0,
      events_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings: [...warnings, "No transcript files found for agent-session bridge."],
    };
  }

  const findings: SessionFinding[] = [];
  for (const filePath of sessionFiles) {
    const parsed = parseSessionFile(filePath);
    if (parsed) {
      findings.push(parsed);
    }
  }

  const artifact = createArtifact(options, findings, sessionFiles);
  const artifactAbsolutePath = resolvePath(options.rootDir, options.artifactPath);
  atomicWrite(artifactAbsolutePath, `${JSON.stringify(artifact, null, 2)}\n`);

  const state = loadState(options.rootDir, options.statePath);
  const eventResult = deriveEvent(options, state, findings);
  if (!eventResult.event) {
    return {
      ok: true,
      sessions_scanned: sessionFiles.length,
      sessions_with_findings: findings.length,
      events_considered: 0,
      events_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings: [...warnings, "No new agent-session findings delta detected."],
      artifact_written: options.artifactPath,
    };
  }

  const requiredArtifactId = `${options.business}-BOS-AGENT_SESSION_FINDINGS`;
  if (!hasRequiredArtifact(registry, requiredArtifactId)) {
    return {
      ok: false,
      sessions_scanned: sessionFiles.length,
      sessions_with_findings: findings.length,
      events_considered: 1,
      events_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings,
      artifact_written: options.artifactPath,
      error: `Registry missing active artifact ${requiredArtifactId}`,
    };
  }

  const orchestrator = runTrialOrchestrator({
    mode: "trial",
    events: [eventResult.event],
    standingRegistry: { artifacts: registry.artifacts },
  });
  if (!orchestrator.ok) {
    return {
      ok: false,
      sessions_scanned: sessionFiles.length,
      sessions_with_findings: findings.length,
      events_considered: 1,
      events_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings,
      artifact_written: options.artifactPath,
      error: orchestrator.error,
    };
  }

  let enqueued = 0;
  try {
    enqueued = enqueueDispatches(options, orchestrator.dispatched);
  } catch (error) {
    return {
      ok: false,
      sessions_scanned: sessionFiles.length,
      sessions_with_findings: findings.length,
      events_considered: 1,
      events_admitted: orchestrator.dispatched.length,
      dispatches_enqueued: 0,
      suppressed: orchestrator.suppressed,
      noop: orchestrator.noop,
      warnings,
      artifact_written: options.artifactPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  writeState(options.rootDir, options.statePath, {
    schema_version: "agent-session-signal-bridge.v1",
    updated_at: new Date().toISOString(),
    findings_hash: eventResult.nextHash,
  });

  return {
    ok: true,
    sessions_scanned: sessionFiles.length,
    sessions_with_findings: findings.length,
    events_considered: 1,
    events_admitted: orchestrator.dispatched.length,
    dispatches_enqueued: enqueued,
    suppressed: orchestrator.suppressed,
    noop: orchestrator.noop,
    warnings: [...warnings, ...orchestrator.warnings],
    artifact_written: options.artifactPath,
  };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const result = runAgentSessionSignalsBridge(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const isDirectExecution = (() => {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  const normalizedEntry = resolve(entry);
  return normalizedEntry.endsWith(`${sep}lp-do-ideas-agent-session-bridge.ts`) ||
    normalizedEntry.endsWith(`${sep}lp-do-ideas-agent-session-bridge.js`);
})();

if (isDirectExecution) {
  main();
}
