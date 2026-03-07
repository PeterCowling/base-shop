import path from "node:path";

import { isNonePlaceholderIdeaCandidate } from "../build/lp-do-build-results-review-parse.js";

import {
  readBackboneQueue,
  resolveBackboneQueuePath,
  writeBackboneQueue,
} from "./self-evolving-backbone-queue.js";
import {
  readCandidateLedger,
  writeCandidateLedger,
} from "./self-evolving-candidates.js";
import type { ImprovementCandidate } from "./self-evolving-contracts.js";
import {
  readMetaObservations,
  readSelfEvolvingEvents,
  replaceMetaObservations,
  replaceSelfEvolvingEvents,
} from "./self-evolving-events.js";
import {
  isNonePlaceholderMetaObservation,
} from "./self-evolving-signal-helpers.js";

interface CliArgs {
  business: string;
  dryRun: boolean;
  rootDir: string;
}

interface HygieneResult {
  business: string;
  dry_run: boolean;
  observations_before: number;
  observations_removed: number;
  observations_after: number;
  events_before: number;
  events_removed: number;
  events_after: number;
  candidates_before: number;
  candidates_removed: number;
  candidates_after: number;
  backbone_entries_before: number;
  backbone_entries_removed: number;
  backbone_entries_after: number;
  removed_observation_ids: string[];
  removed_candidate_ids: string[];
  source_paths: {
    observations: string;
    events: string;
    candidates: string;
    backbone_queue: string;
  };
}

function defaultRootDir(): string {
  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function parseArgs(argv: string[]): CliArgs {
  const flags = new Map<string, string>();
  const bareArgs = new Set<string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) continue;
    if (token.startsWith("--")) {
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        bareArgs.add(token);
        continue;
      }
      flags.set(token.slice(2), next);
      index += 1;
      continue;
    }
  }

  return {
    business: flags.get("business") ?? "BRIK",
    dryRun: bareArgs.has("--dry-run"),
    rootDir: flags.get("root-dir") ?? defaultRootDir(),
  };
}

function extractPlaceholderCandidateSubject(problemStatement: string): string | null {
  const match = problemStatement.match(
    /^Reduce recurring build-output idea work for\s+(.+?)\.\s+Recurred\s+\d+\s+times/i,
  );
  if (!match?.[1]) {
    return null;
  }
  const subject = match[1].trim();
  return subject.length > 0 ? subject : null;
}

function isPlaceholderCandidate(
  candidate: ImprovementCandidate,
  removedObservationIds: ReadonlySet<string>,
): boolean {
  if (
    candidate.trigger_observations.some((observationId) =>
      removedObservationIds.has(observationId),
    )
  ) {
    return true;
  }

  const subject = extractPlaceholderCandidateSubject(candidate.problem_statement);
  return subject != null && isNonePlaceholderIdeaCandidate(subject);
}

export function runSelfEvolvingPlaceholderHygiene(args: CliArgs): HygieneResult {
  const observations = readMetaObservations(args.rootDir, args.business);
  const events = readSelfEvolvingEvents(args.rootDir, args.business);
  const candidateLedger = readCandidateLedger(args.rootDir, args.business);
  const backboneEntries = readBackboneQueue(args.rootDir, args.business);

  const removedObservations = observations.filter((observation) =>
    isNonePlaceholderMetaObservation(observation),
  );
  const removedObservationIds = new Set(
    removedObservations.map((observation) => observation.observation_id),
  );
  const keptObservations = observations.filter(
    (observation) => !removedObservationIds.has(observation.observation_id),
  );
  const keptEvents = events.filter(
    (event) => !removedObservationIds.has(event.correlation_id),
  );

  const removedCandidates = candidateLedger.candidates.filter((rankedCandidate) =>
    isPlaceholderCandidate(rankedCandidate.candidate, removedObservationIds),
  );
  const removedCandidateIds = new Set(
    removedCandidates.map((rankedCandidate) => rankedCandidate.candidate.candidate_id),
  );
  const keptCandidates = candidateLedger.candidates.filter(
    (rankedCandidate) =>
      !removedCandidateIds.has(rankedCandidate.candidate.candidate_id),
  );
  const keptBackboneEntries = backboneEntries.filter(
    (entry) => !removedCandidateIds.has(entry.candidate_id),
  );

  if (!args.dryRun) {
    replaceMetaObservations(args.rootDir, args.business, keptObservations);
    replaceSelfEvolvingEvents(args.rootDir, args.business, keptEvents);
    writeCandidateLedger(
      args.rootDir,
      args.business,
      keptCandidates,
    );
    writeBackboneQueue(args.rootDir, args.business, keptBackboneEntries);
  }

  return {
    business: args.business,
    dry_run: args.dryRun,
    observations_before: observations.length,
    observations_removed: removedObservations.length,
    observations_after: keptObservations.length,
    events_before: events.length,
    events_removed: events.length - keptEvents.length,
    events_after: keptEvents.length,
    candidates_before: candidateLedger.candidates.length,
    candidates_removed: removedCandidates.length,
    candidates_after: keptCandidates.length,
    backbone_entries_before: backboneEntries.length,
    backbone_entries_removed: backboneEntries.length - keptBackboneEntries.length,
    backbone_entries_after: keptBackboneEntries.length,
    removed_observation_ids: [...removedObservationIds].sort(),
    removed_candidate_ids: [...removedCandidateIds].sort(),
    source_paths: {
      observations: path.join(
        args.rootDir,
        "docs",
        "business-os",
        "startup-loop",
        "self-evolving",
        args.business,
        "observations.jsonl",
      ),
      events: path.join(
        args.rootDir,
        "docs",
        "business-os",
        "startup-loop",
        "self-evolving",
        args.business,
        "events.jsonl",
      ),
      candidates: path.join(
        args.rootDir,
        "docs",
        "business-os",
        "startup-loop",
        "self-evolving",
        args.business,
        "candidates.json",
      ),
      backbone_queue: resolveBackboneQueuePath(args.rootDir, args.business),
    },
  };
}

function main(): void {
  const result = runSelfEvolvingPlaceholderHygiene(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]?.includes("self-evolving-placeholder-hygiene")) {
  main();
}
