import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { T1_SEMANTIC_KEYWORDS } from "./lp-do-ideas-trial.js";

const DEFAULT_QUEUE_STATE_PATH = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "ideas",
  "trial",
  "queue-state.json",
);
const DEFAULT_PRIORS_PATH = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "ideas",
  "trial",
  "keyword-calibration-priors.json",
);

const DELTA_COMPLETED = 4;
const DELTA_SKIPPED = -8;
const CANDIDATE_TERM_GATE = 3;
const PRIOR_CAP = 30;
const TOKEN_PATTERN = /[a-z0-9]+/g;

export const MIN_KEYWORDS_GATE = 5;

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "via",
  "with",
]);

interface QueueDispatchRecord {
  trigger?: unknown;
  queue_state?: unknown;
  area_anchor?: unknown;
}

interface QueueStateRecord {
  dispatches?: unknown;
}

type TerminalQueueState = "completed" | "skipped";

interface TerminalDispatch {
  queue_state: TerminalQueueState;
  area_anchor: string;
}

export interface KeywordCalibrationPriors {
  calibrated_at: string;
  event_count: number;
  keywords_calibrated: number;
  keywords_below_gate: string[];
  priors: Record<string, number>;
  candidates: Array<{ term: string; count: number }>;
}

export interface CalibrationResult {
  ok: boolean;
  reason?: string;
  dry_run: boolean;
  priors?: KeywordCalibrationPriors;
}

export interface KeywordCalibrationOptions {
  queueStatePath: string;
  priorsPath: string;
  dryRun?: boolean;
  now?: () => Date;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveRootDir(): string {
  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function resolvePath(rootDir: string, value: string): string {
  return path.isAbsolute(value) ? value : path.join(rootDir, value);
}

function toTerminalState(value: unknown): TerminalQueueState | null {
  if (value === "completed" || value === "skipped") {
    return value;
  }
  return null;
}

function readTerminalArtifactDeltaDispatches(parsed: QueueStateRecord): TerminalDispatch[] {
  if (!Array.isArray(parsed.dispatches)) {
    return [];
  }

  const terminal: TerminalDispatch[] = [];
  for (const rawDispatch of parsed.dispatches as QueueDispatchRecord[]) {
    if (typeof rawDispatch !== "object" || rawDispatch === null) {
      continue;
    }
    if (rawDispatch.trigger !== "artifact_delta") {
      continue;
    }
    const terminalState = toTerminalState(rawDispatch.queue_state);
    if (!terminalState) {
      continue;
    }
    if (typeof rawDispatch.area_anchor !== "string" || rawDispatch.area_anchor.trim().length === 0) {
      continue;
    }
    terminal.push({
      queue_state: terminalState,
      area_anchor: rawDispatch.area_anchor,
    });
  }

  return terminal;
}

function dispatchDelta(state: TerminalQueueState): number {
  return state === "completed" ? DELTA_COMPLETED : DELTA_SKIPPED;
}

function matchingKeywords(areaAnchor: string, keywords: readonly string[]): string[] {
  const loweredAnchor = areaAnchor.toLowerCase();
  return keywords.filter((keyword) => loweredAnchor.includes(keyword.toLowerCase()));
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeCandidates(
  terminalDispatches: readonly TerminalDispatch[],
  keywords: readonly string[],
): Array<{ term: string; count: number }> {
  const keywordTerms = new Set(
    keywords.map((keyword) => keyword.toLowerCase().trim()).filter((keyword) => keyword.length > 0),
  );

  const completedOnly = terminalDispatches.filter((dispatch) => dispatch.queue_state === "completed");
  const termCounts = new Map<string, number>();

  for (const dispatch of completedOnly) {
    const tokens = dispatch.area_anchor.toLowerCase().match(TOKEN_PATTERN) ?? [];
    const uniqueTerms = new Set(
      tokens.filter(
        (token) =>
          token.length >= 3 &&
          !STOPWORDS.has(token) &&
          !keywordTerms.has(token),
      ),
    );
    for (const term of uniqueTerms) {
      termCounts.set(term, (termCounts.get(term) ?? 0) + 1);
    }
  }

  return [...termCounts.entries()]
    .filter(([, count]) => count >= CANDIDATE_TERM_GATE)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([term, count]) => ({ term, count }));
}

async function writePriorsAtomic(priorsPath: string, priors: KeywordCalibrationPriors): Promise<void> {
  await mkdir(path.dirname(priorsPath), { recursive: true });
  const tmpPath = `${priorsPath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmpPath, `${JSON.stringify(priors, null, 2)}\n`, "utf-8");
  await rename(tmpPath, priorsPath);
}

export async function calibrateKeywords(
  options: KeywordCalibrationOptions,
): Promise<CalibrationResult> {
  const dryRun = options.dryRun ?? false;
  const now = options.now ?? (() => new Date());

  let queueStateRaw: string;
  try {
    queueStateRaw = await readFile(options.queueStatePath, "utf-8");
  } catch {
    return { ok: false, reason: "read_error", dry_run: dryRun };
  }

  let parsedQueueState: QueueStateRecord;
  try {
    parsedQueueState = JSON.parse(queueStateRaw) as QueueStateRecord;
  } catch {
    return { ok: false, reason: "parse_error", dry_run: dryRun };
  }

  const terminalDispatches = readTerminalArtifactDeltaDispatches(parsedQueueState);
  if (terminalDispatches.length === 0) {
    return { ok: false, reason: "no_terminal_dispatches", dry_run: dryRun };
  }

  const deltasByKeyword = new Map<string, number[]>();
  for (const dispatch of terminalDispatches) {
    const delta = dispatchDelta(dispatch.queue_state);
    for (const keyword of matchingKeywords(dispatch.area_anchor, T1_SEMANTIC_KEYWORDS)) {
      if (!deltasByKeyword.has(keyword)) {
        deltasByKeyword.set(keyword, []);
      }
      deltasByKeyword.get(keyword)!.push(delta);
    }
  }

  const priors: Record<string, number> = {};
  const keywordsBelowGate: string[] = [];

  for (const keyword of [...deltasByKeyword.keys()].sort((a, b) => a.localeCompare(b))) {
    const deltas = deltasByKeyword.get(keyword) ?? [];
    if (deltas.length < MIN_KEYWORDS_GATE) {
      keywordsBelowGate.push(keyword);
      continue;
    }
    const averaged = mean(deltas);
    const clamped = clamp(averaged, -PRIOR_CAP, PRIOR_CAP);
    priors[keyword] = Math.round(clamped);
  }

  const calibratedPriors: KeywordCalibrationPriors = {
    calibrated_at: now().toISOString(),
    event_count: terminalDispatches.length,
    keywords_calibrated: Object.keys(priors).length,
    keywords_below_gate: keywordsBelowGate,
    priors,
    candidates: computeCandidates(terminalDispatches, T1_SEMANTIC_KEYWORDS),
  };

  if (!dryRun) {
    await writePriorsAtomic(options.priorsPath, calibratedPriors);
  }

  return {
    ok: true,
    dry_run: dryRun,
    priors: calibratedPriors,
  };
}

interface CliOptions {
  queueStatePath: string;
  priorsPath: string;
  dryRun: boolean;
}

function parseCliArgs(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      "root-dir": {
        type: "string",
      },
      "queue-state-path": {
        type: "string",
      },
      "priors-path": {
        type: "string",
      },
      "dry-run": {
        type: "boolean",
      },
    },
    strict: true,
    allowPositionals: false,
  });

  const rootDirValue = typeof values["root-dir"] === "string" ? values["root-dir"] : resolveRootDir();
  const rootDir = path.isAbsolute(rootDirValue) ? rootDirValue : path.resolve(process.cwd(), rootDirValue);

  const queueStateValue =
    typeof values["queue-state-path"] === "string"
      ? values["queue-state-path"]
      : DEFAULT_QUEUE_STATE_PATH;
  const priorsValue =
    typeof values["priors-path"] === "string" ? values["priors-path"] : DEFAULT_PRIORS_PATH;

  return {
    queueStatePath: resolvePath(rootDir, queueStateValue),
    priorsPath: resolvePath(rootDir, priorsValue),
    dryRun: values["dry-run"] === true,
  };
}

async function main(): Promise<void> {
  const cli = parseCliArgs(process.argv.slice(2));
  const result = await calibrateKeywords({
    queueStatePath: cli.queueStatePath,
    priorsPath: cli.priorsPath,
    dryRun: cli.dryRun,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(
      `${JSON.stringify({ ok: false, reason: "error", dry_run: false, error: message }, null, 2)}\n`,
    );
    process.exitCode = 1;
  });
}
