import {
  closeSync,
  existsSync,
  fstatSync,
  lstatSync,
  openSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  readSync,
  realpathSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

export type WorkflowRuntimeUsageProvider = "codex" | "claude";

export type WorkflowRuntimeUsageMode =
  | "delta_from_previous_feature_record"
  | "last_response_fallback";

export interface WorkflowRuntimeTokenSnapshot {
  provider: WorkflowRuntimeUsageProvider;
  sessionId: string;
  snapshotAt: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  lastInputTokens: number | null;
  lastOutputTokens: number | null;
}

export interface WorkflowRuntimeTokenBaseline {
  feature_slug: string;
  runtime_usage_provider: WorkflowRuntimeUsageProvider | null;
  runtime_session_id: string | null;
  runtime_total_input_tokens: number | null;
  runtime_total_output_tokens: number | null;
}

export interface WorkflowRuntimeTokenUsage {
  modelInputTokens: number | null;
  modelOutputTokens: number | null;
  tokenSource: "api_usage" | "unknown";
  runtimeUsageProvider: WorkflowRuntimeUsageProvider | null;
  runtimeSessionId: string | null;
  runtimeUsageMode: WorkflowRuntimeUsageMode | null;
  runtimeUsageSnapshotAt: string | null;
  runtimeTotalInputTokens: number | null;
  runtimeTotalOutputTokens: number | null;
  note: string | null;
}

export interface ResolveWorkflowRuntimeTokenUsageOptions {
  existingRecords: readonly WorkflowRuntimeTokenBaseline[];
  featureSlug: string;
  env?: NodeJS.ProcessEnv;
  codexSessionsRoot?: string;
  claudeTelemetryRoot?: string;
  claudeProjectsRoot?: string;
  claudeDebugDir?: string;
  cwd?: string;
}

const DEFAULT_CODEX_SESSIONS_ROOT = path.join(os.homedir(), ".codex", "sessions");
const DEFAULT_CLAUDE_TELEMETRY_ROOT = path.join(os.homedir(), ".claude", "telemetry");
const DEFAULT_CLAUDE_PROJECTS_ROOT = path.join(os.homedir(), ".claude", "projects");
const DEFAULT_CLAUDE_DEBUG_DIR = path.join(os.homedir(), ".claude", "debug");
const CLAUDE_BASE_DIR = path.join(os.homedir(), ".claude");
const TAIL_SCAN_WINDOWS = [512 * 1024, 2 * 1024 * 1024, 8 * 1024 * 1024] as const;

interface CodexTokenUsageRecord {
  timestamp?: string;
  type?: string;
  payload?: {
    type?: string;
    info?: {
      total_token_usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
      last_token_usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    };
  };
}

interface ClaudeTelemetryRecord {
  event_data?: {
    additional_metadata?: string | Record<string, unknown> | null;
    client_timestamp?: string;
    event_name?: string;
    session_id?: string;
  };
}

interface ClaudeTokenUsageEvent {
  inputTokens: number;
  outputTokens: number;
  snapshotAt: string;
}

function listFilesRecursive(dirPath: string): string[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const results: string[] = [];
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath));
      continue;
    }
    if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function findCodexSessionLog(
  env: NodeJS.ProcessEnv,
  sessionsRoot: string,
): { sessionId: string; filePath: string } | null {
  const threadId = env.CODEX_THREAD_ID?.trim();
  if (!threadId) {
    return null;
  }

  const matches = listFilesRecursive(sessionsRoot)
    .filter((filePath) => filePath.endsWith(".jsonl") && path.basename(filePath).includes(threadId))
    .sort();

  const filePath = matches.at(-1);
  if (!filePath) {
    return null;
  }

  return {
    sessionId: threadId,
    filePath,
  };
}

function readTail(filePath: string, maxBytes: number): string {
  const fd = openSync(filePath, "r");
  try {
    const size = fstatSync(fd).size;
    const bytesToRead = Math.min(size, maxBytes);
    const start = Math.max(0, size - bytesToRead);
    const buffer = Buffer.alloc(bytesToRead);
    readSync(fd, buffer, 0, bytesToRead, start);
    return buffer.toString("utf-8");
  } finally {
    closeSync(fd);
  }
}

function parseCodexTokenUsageRecord(line: string): WorkflowRuntimeTokenSnapshot | null {
  let parsed: CodexTokenUsageRecord;
  try {
    parsed = JSON.parse(line) as CodexTokenUsageRecord;
  } catch {
    return null;
  }

  if (parsed.type !== "event_msg" || parsed.payload?.type !== "token_count") {
    return null;
  }

  const total = parsed.payload.info?.total_token_usage;
  if (
    typeof parsed.timestamp !== "string" ||
    typeof total?.input_tokens !== "number" ||
    typeof total.output_tokens !== "number"
  ) {
    return null;
  }

  const last = parsed.payload.info?.last_token_usage;
  return {
    provider: "codex",
    sessionId: "",
    snapshotAt: parsed.timestamp,
    totalInputTokens: total.input_tokens,
    totalOutputTokens: total.output_tokens,
    lastInputTokens: typeof last?.input_tokens === "number" ? last.input_tokens : null,
    lastOutputTokens: typeof last?.output_tokens === "number" ? last.output_tokens : null,
  };
}

function readLatestCodexTokenSnapshot(
  filePath: string,
  sessionId: string,
): WorkflowRuntimeTokenSnapshot | null {
  for (const windowBytes of TAIL_SCAN_WINDOWS) {
    const tail = readTail(filePath, windowBytes);
    const lines = tail.split("\n");
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index]?.trim();
      if (!line) {
        continue;
      }
      const snapshot = parseCodexTokenUsageRecord(line);
      if (snapshot) {
        return {
          ...snapshot,
          sessionId,
        };
      }
    }
  }
  return null;
}

/**
 * Validate that a resolved path is within the ~/.claude/ directory.
 * Prevents symlink escape attacks.
 */
export function validateClaudePath(resolvedPath: string): boolean {
  const claudeBase = realpathSync(CLAUDE_BASE_DIR);
  return resolvedPath.startsWith(claudeBase + path.sep) || resolvedPath === claudeBase;
}

interface SessionJsonlUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

interface SessionJsonlLine {
  type?: string;
  message?: {
    usage?: SessionJsonlUsage;
  };
}

/**
 * Parse a Claude Code session JSONL file and sum per-message usage into a
 * cumulative WorkflowRuntimeTokenSnapshot. Streams line-by-line — does not
 * parse the entire file into memory as a single JSON structure.
 */
export function parseSessionJsonlUsage(
  filePath: string,
  sessionId: string,
): WorkflowRuntimeTokenSnapshot | null {
  if (!existsSync(filePath)) {
    return null;
  }

  let totalInput = 0;
  let totalOutput = 0;
  let lastInput: number | null = null;
  let lastOutput: number | null = null;
  let latestSnapshotAt: string | null = null;
  let messageCount = 0;

  const content = readFileSync(filePath, "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    let parsed: SessionJsonlLine;
    try {
      parsed = JSON.parse(line) as SessionJsonlLine;
    } catch {
      continue;
    }

    if (parsed.type !== "assistant") {
      continue;
    }

    const usage = parsed.message?.usage;
    if (!usage) {
      continue;
    }

    const inputTokens = typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
    const outputTokens = typeof usage.output_tokens === "number" ? usage.output_tokens : 0;
    const cacheCreation =
      typeof usage.cache_creation_input_tokens === "number" ? usage.cache_creation_input_tokens : 0;
    const cacheRead =
      typeof usage.cache_read_input_tokens === "number" ? usage.cache_read_input_tokens : 0;

    totalInput += inputTokens + cacheCreation + cacheRead;
    totalOutput += outputTokens;
    lastInput = inputTokens + cacheCreation + cacheRead;
    lastOutput = outputTokens;
    messageCount += 1;
  }

  if (messageCount === 0) {
    return null;
  }

  latestSnapshotAt = new Date().toISOString();

  return {
    provider: "claude",
    sessionId,
    snapshotAt: latestSnapshotAt,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    lastInputTokens: lastInput,
    lastOutputTokens: lastOutput,
  };
}

interface SessionsIndexEntry {
  sessionId?: string;
  fullPath?: string;
  fileMtime?: number;
  projectPath?: string;
}

interface SessionsIndex {
  version?: number;
  entries?: SessionsIndexEntry[];
}

/**
 * Read sessions-index.json for the given CWD-encoded project directory.
 * Returns the latest session (by fileMtime) whose projectPath matches the CWD.
 */
export function findClaudeSessionFromIndex(
  projectsRoot: string,
  cwd: string,
): { sessionId: string; sessionJsonlPath: string } | null {
  const encodedCwd = cwd.replaceAll("/", "-");
  const projectDir = path.join(projectsRoot, encodedCwd);
  const indexPath = path.join(projectDir, "sessions-index.json");

  if (!existsSync(indexPath)) {
    return null;
  }

  let index: SessionsIndex;
  try {
    index = JSON.parse(readFileSync(indexPath, "utf-8")) as SessionsIndex;
  } catch {
    return null;
  }

  if (!Array.isArray(index.entries) || index.entries.length === 0) {
    return null;
  }

  // Filter to entries matching this project, sort by mtime descending
  const matching = index.entries
    .filter(
      (entry): entry is SessionsIndexEntry & { sessionId: string; fullPath: string; fileMtime: number } =>
        typeof entry.sessionId === "string" &&
        typeof entry.fullPath === "string" &&
        typeof entry.fileMtime === "number",
    )
    .sort((a, b) => b.fileMtime - a.fileMtime);

  const latest = matching[0];
  if (!latest) {
    return null;
  }

  // Validate the session JSONL path stays within ~/.claude/
  let resolvedPath: string;
  try {
    // The file may not exist yet if the session is very new — use the directory
    const sessionDir = path.dirname(latest.fullPath);
    if (!existsSync(sessionDir)) {
      return null;
    }
    resolvedPath = realpathSync(sessionDir);
  } catch {
    return null;
  }

  if (!validateClaudePath(resolvedPath)) {
    return null;
  }

  return {
    sessionId: latest.sessionId,
    sessionJsonlPath: latest.fullPath,
  };
}

/**
 * Resolve the debug/latest symlink to discover the current Claude session UUID.
 * Returns the session UUID extracted from the symlink target filename.
 */
export function findClaudeSessionFromDebugLatest(
  debugDir: string,
  projectsRoot: string,
  cwd: string,
): { sessionId: string; sessionJsonlPath: string } | null {
  const latestLink = path.join(debugDir, "latest");

  try {
    const stat = lstatSync(latestLink);
    if (!stat.isSymbolicLink()) {
      return null;
    }
  } catch {
    return null;
  }

  let target: string;
  try {
    target = readlinkSync(latestLink);
    // Resolve relative symlink targets
    if (!path.isAbsolute(target)) {
      target = path.resolve(debugDir, target);
    }
  } catch {
    return null;
  }

  // Extract UUID from filename (e.g., "69d199f6-bf3f-4837-a680-8fa673ae6207.txt")
  const basename = path.basename(target);
  const uuidMatch = basename.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  if (!uuidMatch) {
    return null;
  }

  const sessionId = uuidMatch[1];

  // Construct the session JSONL path for this CWD
  const encodedCwd = cwd.replaceAll("/", "-");
  const sessionJsonlPath = path.join(projectsRoot, encodedCwd, `${sessionId}.jsonl`);

  // Validate the path stays within ~/.claude/
  const projectDir = path.join(projectsRoot, encodedCwd);
  try {
    if (!existsSync(projectDir)) {
      return null;
    }
    const resolvedDir = realpathSync(projectDir);
    if (!validateClaudePath(resolvedDir)) {
      return null;
    }
  } catch {
    return null;
  }

  if (!existsSync(sessionJsonlPath)) {
    return null;
  }

  return { sessionId, sessionJsonlPath };
}

function resolveCodexSnapshot(
  env: NodeJS.ProcessEnv,
  sessionsRoot: string,
): WorkflowRuntimeTokenSnapshot | null {
  const session = findCodexSessionLog(env, sessionsRoot);
  if (!session) {
    return null;
  }
  return readLatestCodexTokenSnapshot(session.filePath, session.sessionId);
}

function findClaudeSessionId(env: NodeJS.ProcessEnv): string | null {
  const candidates = [
    env.WORKFLOW_TELEMETRY_CLAUDE_SESSION_ID,
    env.CLAUDE_SESSION_ID,
    env.CLAUDE_CODE_SESSION_ID,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

function parseClaudeAdditionalMetadata(
  metadata: string | Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!metadata) {
    return null;
  }
  if (typeof metadata === "object") {
    return metadata;
  }

  try {
    const parsed = JSON.parse(metadata);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readOptionalNumber(
  record: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseClaudeApiSuccessRecord(
  line: string,
  sessionId: string,
): ClaudeTokenUsageEvent | null {
  let parsed: ClaudeTelemetryRecord;
  try {
    parsed = JSON.parse(line) as ClaudeTelemetryRecord;
  } catch {
    return null;
  }

  if (
    parsed.event_data?.event_name !== "tengu_api_success" ||
    parsed.event_data.session_id !== sessionId ||
    typeof parsed.event_data.client_timestamp !== "string"
  ) {
    return null;
  }

  const metadata = parseClaudeAdditionalMetadata(parsed.event_data.additional_metadata);
  const outputTokens = readOptionalNumber(metadata, "outputTokens");
  if (outputTokens === null) {
    return null;
  }

  const cachedInputTokens = readOptionalNumber(metadata, "cachedInputTokens");
  const uncachedInputTokens = readOptionalNumber(metadata, "uncachedInputTokens");
  const inputTokens = readOptionalNumber(metadata, "inputTokens");
  const messageTokens = readOptionalNumber(metadata, "messageTokens");
  const totalInputTokens =
    cachedInputTokens !== null || uncachedInputTokens !== null
      ? (cachedInputTokens ?? 0) + (uncachedInputTokens ?? 0) + (inputTokens ?? 0)
      : messageTokens ?? inputTokens;

  if (totalInputTokens === null) {
    return null;
  }

  return {
    inputTokens: totalInputTokens,
    outputTokens,
    snapshotAt: parsed.event_data.client_timestamp,
  };
}

function readClaudeSessionSnapshot(
  telemetryRoot: string,
  sessionId: string,
): WorkflowRuntimeTokenSnapshot | null {
  const matchingFiles = listFilesRecursive(telemetryRoot)
    .filter((filePath) => /\.(json|jsonl)$/u.test(filePath) && path.basename(filePath).includes(sessionId))
    .sort();

  if (matchingFiles.length === 0) {
    return null;
  }

  const events: ClaudeTokenUsageEvent[] = [];
  for (const filePath of matchingFiles) {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      const event = parseClaudeApiSuccessRecord(trimmed, sessionId);
      if (event) {
        events.push(event);
      }
    }
  }

  if (events.length === 0) {
    return null;
  }

  const orderedEvents = events.sort((left, right) => left.snapshotAt.localeCompare(right.snapshotAt));
  const latestEvent = orderedEvents.at(-1);
  if (!latestEvent) {
    return null;
  }

  return {
    provider: "claude",
    sessionId,
    snapshotAt: latestEvent.snapshotAt,
    totalInputTokens: orderedEvents.reduce((sum, event) => sum + event.inputTokens, 0),
    totalOutputTokens: orderedEvents.reduce((sum, event) => sum + event.outputTokens, 0),
    lastInputTokens: latestEvent.inputTokens,
    lastOutputTokens: latestEvent.outputTokens,
  };
}

/**
 * Hybrid cascade for Claude token capture.
 * Resolve order (authoritative):
 *   1. Explicit session ID (env var / CLI flag) — AUTHORITATIVE
 *   2. sessions-index.json (project-scoped) — PRIMARY auto-discovery
 *   3. debug/latest symlink (global) — FALLBACK heuristic
 *   4. null → unknown token source — FAIL-OPEN default
 */
function resolveClaudeSnapshot(
  env: NodeJS.ProcessEnv,
  telemetryRoot: string,
  projectsRoot: string,
  debugDir: string,
  cwd: string,
): { snapshot: WorkflowRuntimeTokenSnapshot; discoveryMethod: string } | null {
  // Step 1: Explicit session ID (authoritative — skips all auto-discovery)
  const explicitSessionId = findClaudeSessionId(env);
  if (explicitSessionId) {
    const snapshot = readClaudeSessionSnapshot(telemetryRoot, explicitSessionId);
    if (snapshot) {
      return { snapshot, discoveryMethod: "explicit_session_id" };
    }
  }

  // Step 2: sessions-index.json (project-scoped auto-discovery)
  const indexResult = findClaudeSessionFromIndex(projectsRoot, cwd);
  if (indexResult) {
    const snapshot = parseSessionJsonlUsage(indexResult.sessionJsonlPath, indexResult.sessionId);
    if (snapshot) {
      return { snapshot, discoveryMethod: "sessions_index" };
    }
  }

  // Step 3: debug/latest symlink (global fallback heuristic)
  const debugResult = findClaudeSessionFromDebugLatest(debugDir, projectsRoot, cwd);
  if (debugResult) {
    const snapshot = parseSessionJsonlUsage(debugResult.sessionJsonlPath, debugResult.sessionId);
    if (snapshot) {
      return { snapshot, discoveryMethod: "debug_latest" };
    }
  }

  // Step 4: null → fail-open
  return null;
}

function buildFallbackUsage(
  snapshot: WorkflowRuntimeTokenSnapshot,
  note: string,
): WorkflowRuntimeTokenUsage {
  return {
    modelInputTokens: snapshot.lastInputTokens,
    modelOutputTokens: snapshot.lastOutputTokens,
    tokenSource:
      snapshot.lastInputTokens !== null || snapshot.lastOutputTokens !== null ? "api_usage" : "unknown",
    runtimeUsageProvider: snapshot.provider,
    runtimeSessionId: snapshot.sessionId,
    runtimeUsageMode:
      snapshot.lastInputTokens !== null || snapshot.lastOutputTokens !== null
        ? "last_response_fallback"
        : null,
    runtimeUsageSnapshotAt: snapshot.snapshotAt,
    runtimeTotalInputTokens: snapshot.totalInputTokens,
    runtimeTotalOutputTokens: snapshot.totalOutputTokens,
    note,
  };
}

export function resolveWorkflowRuntimeTokenUsage(
  options: ResolveWorkflowRuntimeTokenUsageOptions,
): WorkflowRuntimeTokenUsage {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const codexSnapshot = resolveCodexSnapshot(env, options.codexSessionsRoot ?? DEFAULT_CODEX_SESSIONS_ROOT);
  const claudeResult = codexSnapshot
    ? null
    : resolveClaudeSnapshot(
        env,
        options.claudeTelemetryRoot ?? DEFAULT_CLAUDE_TELEMETRY_ROOT,
        options.claudeProjectsRoot ?? DEFAULT_CLAUDE_PROJECTS_ROOT,
        options.claudeDebugDir ?? DEFAULT_CLAUDE_DEBUG_DIR,
        cwd,
      );
  const snapshot = codexSnapshot ?? claudeResult?.snapshot ?? null;
  const discoveryNote = claudeResult ? `claude_discovery:${claudeResult.discoveryMethod}` : null;
  if (!snapshot) {
    return {
      modelInputTokens: null,
      modelOutputTokens: null,
      tokenSource: "unknown",
      runtimeUsageProvider: null,
      runtimeSessionId: null,
      runtimeUsageMode: null,
      runtimeUsageSnapshotAt: null,
      runtimeTotalInputTokens: null,
      runtimeTotalOutputTokens: null,
      note: null,
    };
  }

  const previous = [...options.existingRecords]
    .reverse()
    .find(
      (record) =>
        record.feature_slug === options.featureSlug &&
        record.runtime_usage_provider === snapshot.provider &&
        record.runtime_session_id === snapshot.sessionId &&
        typeof record.runtime_total_input_tokens === "number" &&
        typeof record.runtime_total_output_tokens === "number",
    );

  if (
    previous &&
    typeof previous.runtime_total_input_tokens === "number" &&
    typeof previous.runtime_total_output_tokens === "number"
  ) {
    const deltaInput = snapshot.totalInputTokens - previous.runtime_total_input_tokens;
    const deltaOutput = snapshot.totalOutputTokens - previous.runtime_total_output_tokens;
    if (deltaInput >= 0 && deltaOutput >= 0) {
      return {
        modelInputTokens: deltaInput,
        modelOutputTokens: deltaOutput,
        tokenSource: "api_usage",
        runtimeUsageProvider: snapshot.provider,
        runtimeSessionId: snapshot.sessionId,
        runtimeUsageMode: "delta_from_previous_feature_record",
        runtimeUsageSnapshotAt: snapshot.snapshotAt,
        runtimeTotalInputTokens: snapshot.totalInputTokens,
        runtimeTotalOutputTokens: snapshot.totalOutputTokens,
        note: discoveryNote,
      };
    }
  }

  return buildFallbackUsage(
    snapshot,
    discoveryNote
      ? `${discoveryNote}; Runtime token capture fell back to the latest response usage because no prior feature baseline was available.`
      : "Runtime token capture fell back to the latest response usage because no prior feature baseline was available.",
  );
}
