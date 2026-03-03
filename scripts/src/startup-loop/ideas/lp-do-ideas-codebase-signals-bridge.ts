import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import type { RegistryV2ArtifactEntry } from "./lp-do-ideas-registry-migrate-v1-v2.js";
import { type ArtifactDeltaEvent, runTrialOrchestrator, type TrialDispatchPacket } from "./lp-do-ideas-trial.js";

type Severity = "critical" | "warning";

interface BugScanFinding {
  ruleId?: string;
  severity?: string;
  message?: string;
  file?: string;
  line?: number;
}

interface BugScanArtifact {
  schema_version?: string;
  generated_at?: string;
  findings?: BugScanFinding[];
}

interface RegistryDocument {
  artifacts: RegistryV2ArtifactEntry[];
}

interface LegacyQueueShape {
  dispatches?: TrialDispatchPacket[];
  counts?: Record<string, number>;
  last_updated?: string;
}

interface BridgeState {
  schema_version: "codebase-signal-bridge.v1";
  updated_at: string;
  bug_scan_hash: string | null;
  codebase_hash: string | null;
}

interface ChangedFile {
  status: string;
  file: string;
}

export interface CodebaseSignalsBridgeOptions {
  rootDir: string;
  business: string;
  registryPath: string;
  queueStatePath: string;
  telemetryPath: string;
  statePath: string;
  bugScanArtifactPath?: string | null;
  fromRef: string;
  toRef: string;
  bugSeverityThreshold: Severity;
  changedFilesOverride?: ChangedFile[];
}

export interface CodebaseSignalsBridgeResult {
  ok: boolean;
  events_considered: number;
  events_admitted: number;
  dispatches_enqueued: number;
  suppressed: number;
  noop: number;
  warnings: string[];
  error?: string;
}

const DEFAULT_REGISTRY_PATH = "docs/business-os/startup-loop/ideas/standing-registry.json";
const DEFAULT_QUEUE_STATE_PATH = "docs/business-os/startup-loop/ideas/trial/queue-state.json";
const DEFAULT_TELEMETRY_PATH = "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl";
const DEFAULT_STATE_PATH = "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json";
const DEFAULT_BUG_SCAN_ARTIFACT_PATH = "docs/plans/_latest/bug-scan-findings.user.json";

function hashValue(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

function resolvePath(rootDir: string, relativeOrAbsolutePath: string): string {
  if (relativeOrAbsolutePath.startsWith("/")) {
    return relativeOrAbsolutePath;
  }
  return join(rootDir, relativeOrAbsolutePath);
}

function atomicWrite(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tempPath = join(dirname(filePath), `.${basename(filePath)}.tmp.${randomBytes(4).toString("hex")}`);
  writeFileSync(tempPath, content, "utf8");
  renameSync(tempPath, filePath);
}

function parseArgs(argv: string[]): CodebaseSignalsBridgeOptions {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const value = argv[i + 1];
    if (!token?.startsWith("--") || !value || value.startsWith("--")) {
      continue;
    }
    flags.set(token.slice(2), value);
    i += 1;
  }

  return {
    rootDir: flags.get("root-dir") ?? process.cwd(),
    business: flags.get("business") ?? "BOS",
    registryPath: flags.get("registry-path") ?? DEFAULT_REGISTRY_PATH,
    queueStatePath: flags.get("queue-state-path") ?? DEFAULT_QUEUE_STATE_PATH,
    telemetryPath: flags.get("telemetry-path") ?? DEFAULT_TELEMETRY_PATH,
    statePath: flags.get("state-path") ?? DEFAULT_STATE_PATH,
    bugScanArtifactPath: flags.get("bug-scan-artifact") ?? DEFAULT_BUG_SCAN_ARTIFACT_PATH,
    fromRef: flags.get("from-ref") ?? "HEAD~1",
    toRef: flags.get("to-ref") ?? "HEAD",
    bugSeverityThreshold: flags.get("bug-severity-threshold") === "warning" ? "warning" : "critical",
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
  if (!parsed || parsed.schema_version !== "codebase-signal-bridge.v1") {
    return {
      schema_version: "codebase-signal-bridge.v1",
      updated_at: new Date(0).toISOString(),
      bug_scan_hash: null,
      codebase_hash: null,
    };
  }
  return parsed;
}

function writeState(rootDir: string, statePath: string, state: BridgeState): void {
  const absolute = resolvePath(rootDir, statePath);
  atomicWrite(absolute, `${JSON.stringify(state, null, 2)}\n`);
}

function listChangedFiles(rootDir: string, fromRef: string, toRef: string): ChangedFile[] {
  const output = execFileSync(
    "git",
    ["diff", "--name-status", `${fromRef}..${toRef}`],
    {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [status, ...rest] = line.split(/\s+/);
      return { status: status ?? "M", file: rest.join(" ").trim() };
    })
    .filter((entry) => entry.file.length > 0);
}

function hasRequiredArtifact(registry: RegistryDocument, artifactId: string): boolean {
  return registry.artifacts.some((entry) => entry.artifact_id === artifactId && entry.active);
}

function severityRank(value: string | undefined): number {
  if (value === "critical") return 2;
  if (value === "warning") return 1;
  return 0;
}

function deriveBugScanEvent(
  options: CodebaseSignalsBridgeOptions,
  state: BridgeState,
  warnings: string[],
): { event: ArtifactDeltaEvent | null; nextHash: string | null } {
  if (!options.bugScanArtifactPath) {
    return { event: null, nextHash: state.bug_scan_hash };
  }

  const absolute = resolvePath(options.rootDir, options.bugScanArtifactPath);
  const artifact = readJsonFile<BugScanArtifact>(absolute);
  if (!artifact || artifact.schema_version !== "bug-scan-findings.v1") {
    warnings.push(`Bug scan artifact not found or invalid: ${options.bugScanArtifactPath}`);
    return { event: null, nextHash: state.bug_scan_hash };
  }

  const threshold = severityRank(options.bugSeverityThreshold);
  const findings = (artifact.findings ?? []).filter((finding) => severityRank(finding.severity) >= threshold);
  if (findings.length === 0) {
    return { event: null, nextHash: state.bug_scan_hash };
  }

  const normalized = findings
    .map((finding) => ({
      ruleId: finding.ruleId ?? "unknown-rule",
      severity: finding.severity ?? "unknown",
      file: finding.file ?? "unknown-file",
      line: finding.line ?? 0,
      message: finding.message ?? "",
    }))
    .sort((left, right) =>
      `${left.ruleId}:${left.file}:${left.line}`.localeCompare(
        `${right.ruleId}:${right.file}:${right.line}`,
      ),
    );
  const nextHash = hashValue(JSON.stringify(normalized));
  if (state.bug_scan_hash === nextHash) {
    return { event: null, nextHash: state.bug_scan_hash };
  }

  const topRules = Array.from(new Set(normalized.map((item) => item.ruleId))).slice(0, 3);
  const changedSections = ["critical finding", "code quality", ...topRules].slice(0, 6);
  const evidenceRefs = normalized
    .slice(0, 5)
    .map((item) => `bug-scan:${item.ruleId}:${item.file}:${item.line}`);

  return {
    event: {
      artifact_id: `${options.business}-BOS-BUG_SCAN_FINDINGS`,
      business: options.business,
      before_sha: state.bug_scan_hash ?? "bootstrap",
      after_sha: nextHash,
      path: options.bugScanArtifactPath,
      changed_sections: changedSections,
      updated_by_process: "bug-scan-signal-bridge",
      material_delta: true,
      evidence_refs: [
        `bug-scan-artifact:${options.bugScanArtifactPath}`,
        ...evidenceRefs,
      ],
    },
    nextHash,
  };
}

function classifyStructuralTags(changedFiles: ChangedFile[]): string[] {
  const tags = new Set<string>();

  for (const changed of changedFiles) {
    const lowered = changed.file.toLowerCase();

    if (
      lowered.endsWith("/package.json") ||
      lowered === "package.json" ||
      lowered === "pnpm-lock.yaml"
    ) {
      tags.add("dependency update");
    }
    if (lowered.includes("/app/api/") || lowered.endsWith("/route.ts") || lowered.endsWith("/route.js")) {
      tags.add("api endpoint");
    }
    if (
      lowered.endsWith("/page.tsx") ||
      lowered.endsWith("/page.ts") ||
      lowered.endsWith("/layout.tsx") ||
      lowered.endsWith("/layout.ts")
    ) {
      tags.add("route change");
    }
    if (
      lowered.includes("schema") ||
      lowered.includes("prisma") ||
      lowered.includes("migration") ||
      lowered.endsWith(".sql")
    ) {
      tags.add("schema change");
    }
    if (changed.status.startsWith("A") && lowered.includes("/component")) {
      tags.add("component addition");
    }
  }

  return Array.from(tags);
}

function deriveCodebaseEvent(
  options: CodebaseSignalsBridgeOptions,
  state: BridgeState,
): { event: ArtifactDeltaEvent | null; nextHash: string | null } {
  const changedFiles = options.changedFilesOverride ?? listChangedFiles(options.rootDir, options.fromRef, options.toRef);
  const relevant = changedFiles.filter((entry) => !entry.file.startsWith("docs/plans/"));
  if (relevant.length === 0) {
    return { event: null, nextHash: state.codebase_hash };
  }

  const tags = classifyStructuralTags(relevant);
  if (tags.length === 0) {
    return { event: null, nextHash: state.codebase_hash };
  }

  const normalized = relevant
    .map((entry) => `${entry.status}:${entry.file}`)
    .sort((left, right) => left.localeCompare(right));
  const nextHash = hashValue(JSON.stringify({ tags: [...tags].sort(), files: normalized }));
  if (state.codebase_hash === nextHash) {
    return { event: null, nextHash: state.codebase_hash };
  }

  const evidenceRefs = relevant.slice(0, 8).map((entry) => `git-diff:${entry.status}:${entry.file}`);

  return {
    event: {
      artifact_id: `${options.business}-BOS-CODEBASE_STRUCTURAL_SIGNALS`,
      business: options.business,
      before_sha: state.codebase_hash ?? "bootstrap",
      after_sha: nextHash,
      path: `git-diff:${options.fromRef}..${options.toRef}`,
      changed_sections: tags,
      updated_by_process: "codebase-signal-bridge",
      material_delta: true,
      evidence_refs: [
        `git-diff-range:${options.fromRef}..${options.toRef}`,
        ...evidenceRefs,
      ],
    },
    nextHash,
  };
}

function buildCounts(dispatches: TrialDispatchPacket[]): Record<string, number> {
  const counts: Record<string, number> = {
    enqueued: 0,
    processed: 0,
    skipped: 0,
    error: 0,
    suppressed: 0,
    auto_executed: 0,
    completed: 0,
    fact_find_ready: 0,
    total: dispatches.length,
  };

  for (const dispatch of dispatches) {
    const queueState = dispatch.queue_state;
    if (typeof queueState === "string" && Object.hasOwn(counts, queueState)) {
      counts[queueState] += 1;
    }
    if (dispatch.status === "fact_find_ready") {
      counts.fact_find_ready += 1;
    }
  }

  return counts;
}

function enqueueDispatches(
  options: CodebaseSignalsBridgeOptions,
  packets: TrialDispatchPacket[],
): number {
  const absoluteQueuePath = resolvePath(options.rootDir, options.queueStatePath);
  const existing = readJsonFile<LegacyQueueShape>(absoluteQueuePath) ?? { dispatches: [] };
  if (!Array.isArray(existing.dispatches)) {
    throw new Error(`Queue state at ${options.queueStatePath} does not contain dispatches[]`);
  }

  const dispatches = existing.dispatches;
  const seenDispatchIds = new Set(dispatches.map((entry) => entry.dispatch_id));
  const seenClusters = new Set(dispatches.map((entry) => `${entry.cluster_key}:${entry.cluster_fingerprint}`));

  let appended = 0;
  const appendedPackets: TrialDispatchPacket[] = [];
  for (const packet of packets) {
    const clusterKey = `${packet.cluster_key}:${packet.cluster_fingerprint}`;
    if (seenDispatchIds.has(packet.dispatch_id) || seenClusters.has(clusterKey)) {
      continue;
    }
    dispatches.push(packet);
    seenDispatchIds.add(packet.dispatch_id);
    seenClusters.add(clusterKey);
    appended += 1;
    appendedPackets.push(packet);
  }

  if (appended === 0) {
    return 0;
  }

  const nowIso = new Date().toISOString();
  const updated: LegacyQueueShape = {
    ...existing,
    last_updated: nowIso,
    dispatches,
    counts: buildCounts(dispatches),
  };
  atomicWrite(absoluteQueuePath, `${JSON.stringify(updated, null, 2)}\n`);

  const absoluteTelemetryPath = resolvePath(options.rootDir, options.telemetryPath);
  mkdirSync(dirname(absoluteTelemetryPath), { recursive: true });
  const telemetryLines = appendedPackets
    .map((packet) =>
      JSON.stringify({
        recorded_at: nowIso,
        dispatch_id: packet.dispatch_id,
        mode: "trial",
        business: packet.business,
        queue_state: "enqueued",
        kind: "enqueued",
        reason: "codebase_signal_bridge",
      }),
    )
    .join("\n");
  if (telemetryLines.length > 0) {
    const prefix = existsSync(absoluteTelemetryPath) && readFileSync(absoluteTelemetryPath, "utf8").trim().length > 0 ? "\n" : "";
    writeFileSync(absoluteTelemetryPath, `${prefix}${telemetryLines}\n`, { encoding: "utf8", flag: "a" });
  }

  return appended;
}

export function runCodebaseSignalsBridge(
  options: CodebaseSignalsBridgeOptions,
): CodebaseSignalsBridgeResult {
  const warnings: string[] = [];

  let registry: RegistryDocument;
  try {
    registry = loadRegistry(options.rootDir, options.registryPath);
  } catch (error) {
    return {
      ok: false,
      events_considered: 0,
      events_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const state = loadState(options.rootDir, options.statePath);
  const bugResult = deriveBugScanEvent(options, state, warnings);
  const codeResult = deriveCodebaseEvent(options, state);

  const events: ArtifactDeltaEvent[] = [];
  if (bugResult.event) {
    const requiredArtifactId = `${options.business}-BOS-BUG_SCAN_FINDINGS`;
    if (hasRequiredArtifact(registry, requiredArtifactId)) {
      events.push(bugResult.event);
    } else {
      warnings.push(`Registry missing active artifact ${requiredArtifactId}; bug-scan signal skipped.`);
    }
  }
  if (codeResult.event) {
    const requiredArtifactId = `${options.business}-BOS-CODEBASE_STRUCTURAL_SIGNALS`;
    if (hasRequiredArtifact(registry, requiredArtifactId)) {
      events.push(codeResult.event);
    } else {
      warnings.push(`Registry missing active artifact ${requiredArtifactId}; codebase signal skipped.`);
    }
  }

  if (events.length === 0) {
    return {
      ok: true,
      events_considered: 0,
      events_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings: [...warnings, "No new codebase/bug-scan signal deltas found."],
    };
  }

  const orchestrator = runTrialOrchestrator({
    mode: "trial",
    events,
    standingRegistry: { artifacts: registry.artifacts },
  });
  if (!orchestrator.ok) {
    return {
      ok: false,
      events_considered: events.length,
      events_admitted: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      noop: 0,
      warnings,
      error: orchestrator.error,
    };
  }

  let enqueued = 0;
  try {
    enqueued = enqueueDispatches(options, orchestrator.dispatched);
  } catch (error) {
    return {
      ok: false,
      events_considered: events.length,
      events_admitted: orchestrator.dispatched.length,
      dispatches_enqueued: 0,
      suppressed: orchestrator.suppressed,
      noop: orchestrator.noop,
      warnings,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  writeState(options.rootDir, options.statePath, {
    schema_version: "codebase-signal-bridge.v1",
    updated_at: new Date().toISOString(),
    bug_scan_hash: bugResult.nextHash,
    codebase_hash: codeResult.nextHash,
  });

  return {
    ok: true,
    events_considered: events.length,
    events_admitted: orchestrator.dispatched.length,
    dispatches_enqueued: enqueued,
    suppressed: orchestrator.suppressed,
    noop: orchestrator.noop,
    warnings: [...warnings, ...orchestrator.warnings],
  };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const result = runCodebaseSignalsBridge(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
