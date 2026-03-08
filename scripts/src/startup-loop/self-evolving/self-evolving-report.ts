import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_MATURE_BOUNDARY_THRESHOLDS,
  evaluateMatureBoundary,
} from "./self-evolving-boundary.js";
import type { RankedCandidate } from "./self-evolving-candidates.js";
import type {
  MetaObservation,
  StartupState,
} from "./self-evolving-contracts.js";
import { buildDashboardSnapshot } from "./self-evolving-dashboard.js";
import { deriveBoundarySignalSnapshotFromStartupState } from "./self-evolving-signal-helpers.js";

interface CliArgs {
  rootDir: string;
  observationsPath: string;
  candidatesPath: string;
  startupStatePath: string;
  business: string;
}

function defaultRootDir(): string {
  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function resolvePath(rootDir: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
}

function parseArgs(argv: string[]): CliArgs {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) continue;
    flags.set(key.slice(2), value);
    index += 1;
  }

  const rootDir = flags.get("root-dir") ?? defaultRootDir();
  const business = flags.get("business") ?? "BRIK";
  const defaultBusinessRoot = path.join(
    "docs",
    "business-os",
    "startup-loop",
    "self-evolving",
    business,
  );

  return {
    rootDir,
    business,
    observationsPath: resolvePath(
      rootDir,
      flags.get("observations") ?? path.join(defaultBusinessRoot, "observations.jsonl"),
    ),
    candidatesPath: resolvePath(
      rootDir,
      flags.get("candidates") ?? path.join(defaultBusinessRoot, "candidates.json"),
    ),
    startupStatePath: resolvePath(
      rootDir,
      flags.get("startup-state") ?? path.join(defaultBusinessRoot, "startup-state.json"),
    ),
  };
}

function readObservations(filePath: string): MetaObservation[] {
  try {
    const raw = readFileSync(filePath, "utf-8").trim();
    if (!raw) return [];
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as MetaObservation);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function readRankedCandidates(filePath: string): RankedCandidate[] {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { candidates?: RankedCandidate[] };
    if (Array.isArray(parsed.candidates)) {
      return parsed.candidates;
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function readStartupState(filePath: string): StartupState | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as StartupState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function collectWarnings(args: CliArgs): string[] {
  const warnings: string[] = [];
  if (!existsSync(args.observationsPath)) {
    warnings.push(`Missing observations file: ${args.observationsPath}`);
  }
  if (!existsSync(args.candidatesPath)) {
    warnings.push(`Missing candidates file: ${args.candidatesPath}`);
  }
  if (!existsSync(args.startupStatePath)) {
    warnings.push(`Missing startup-state file: ${args.startupStatePath}`);
  }
  return warnings;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const observations = readObservations(args.observationsPath);
  const rankedCandidates = readRankedCandidates(args.candidatesPath);
  const startupState = readStartupState(args.startupStatePath);
  const warnings = collectWarnings(args);

  const dashboard = buildDashboardSnapshot({
    observations,
    ranked_candidates: rankedCandidates,
    wipCap: 10,
  });

  const boundarySnapshot = deriveBoundarySignalSnapshotFromStartupState(startupState);
  const boundaryDecision = evaluateMatureBoundary(
    boundarySnapshot.signals,
    DEFAULT_MATURE_BOUNDARY_THRESHOLDS,
  );

  const report = {
    business: args.business,
    generated_at: new Date().toISOString(),
    source_paths: {
      observations: args.observationsPath,
      candidates: args.candidatesPath,
      startup_state: args.startupStatePath,
    },
    warnings,
    startup_state_present: startupState != null,
    dashboard,
    boundary: {
      ...boundaryDecision,
      signals_used: boundarySnapshot.signals,
      signal_sources: boundarySnapshot.sources,
      thresholds: DEFAULT_MATURE_BOUNDARY_THRESHOLDS,
    },
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1]?.includes("self-evolving-report")) {
  main();
}
