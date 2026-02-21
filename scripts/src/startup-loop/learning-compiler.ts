/**
 * Learning Compiler
 *
 * Compiles experiment readouts into learning ledger entries with prior deltas.
 * Implements prior-ref routing (explicit vs keyword fallback) and invertible
 * confidence deltas.
 *
 * Task: LC-04 from docs/plans/archive/learning-compiler-plan.md
 */

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';

import type { Prior, PriorIndex } from './baseline-priors';
import { extractPriors } from './baseline-priors';
import type { LearningEntry } from './learning-ledger';

/**
 * Experiment readout input for compilation.
 */
export interface ExperimentReadout {
  experiment_id: string;
  run_id: string;
  readout_path: string;
  verdict: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  prior_refs?: string[]; // optional explicit prior references
  metrics?: Record<string, number>; // compiler-consumed metric values
}

/**
 * Prior delta representing a confidence change.
 */
export interface PriorDelta {
  prior_id: string;
  artifact_path: string;
  old_confidence: number;
  new_confidence: number;
  delta: number;
  reason: string;
  evidence_ref: string;
  mapping_confidence: 'exact' | 'keyword' | 'ambiguous';
}

/**
 * Compilation result containing learning entry and prior deltas.
 */
export interface CompilerResult {
  learningEntry: Omit<LearningEntry, 'created_at'>; // caller adds timestamp
  priorDeltas: PriorDelta[];
  mappingDiagnostics: string[];
}

/**
 * Confidence level weights for delta computation.
 */
const CONFIDENCE_WEIGHTS: Record<string, number> = {
  HIGH: 1.0,
  MEDIUM: 0.5,
  LOW: 0.25,
};

/**
 * SHA-256 hash function.
 */
function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf-8').digest('hex');
}

/**
 * Compute digest for experiment readout.
 * Includes only semantic fields, excludes timestamps and narrative prose.
 */
function computeReadoutDigest(readout: ExperimentReadout): string {
  // Build canonical payload with sorted keys
  const payload = {
    confidence: readout.confidence,
    experiment_id: readout.experiment_id,
    metrics: readout.metrics || null,
    prior_refs: readout.prior_refs || null,
    verdict: readout.verdict,
  };

  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return sha256(canonical);
}

/**
 * Compute entry_id from run_id, experiment_id, and readout digest.
 */
function computeEntryId(
  runId: string,
  experimentId: string,
  readoutDigest: string
): string {
  return sha256(`${runId}${experimentId}${readoutDigest}`);
}

/**
 * Resolve a prior reference to index entries.
 * Supports formats:
 * - "artifact_scope#prior_id"
 * - "artifact_path#prior_id"
 * - "prior_id" (bare, must be unambiguous)
 */
function resolvePriorRef(
  ref: string,
  priorIndex: PriorIndex
): { entries: typeof priorIndex.entries; ambiguous: boolean } {
  // Check for scope-qualified format: "scope#prior_id"
  if (ref.includes('#')) {
    const [scopeOrPath, priorId] = ref.split('#', 2);

    // Try artifact_scope match first
    const scopeMatches = priorIndex.entries.filter(
      e => e.artifact_scope === scopeOrPath && e.prior_id === priorId
    );
    if (scopeMatches.length > 0) {
      return { entries: scopeMatches, ambiguous: false };
    }

    // Try artifact_path match
    const pathMatches = priorIndex.entries.filter(
      e => e.artifact_path === scopeOrPath && e.prior_id === priorId
    );
    if (pathMatches.length > 0) {
      return { entries: pathMatches, ambiguous: false };
    }

    // Not found
    return { entries: [], ambiguous: false };
  }

  // Bare prior_id - look up in by_id map
  const matches = priorIndex.by_id.get(ref) || [];
  return { entries: matches, ambiguous: false };
}

/**
 * Keyword-based fallback matching for prior references.
 * Splits experiment_id into tokens and matches against prior ids/statements.
 */
function keywordMatchPriors(
  experimentId: string,
  priorIndex: PriorIndex,
  options?: { baseDir?: string }
): { entries: typeof priorIndex.entries; ambiguous: boolean } {
  // Tokenize experiment_id
  const tokens = experimentId
    .split(/[.\-_]/)
    .map(t => t.toLowerCase())
    .filter(t => t.length > 0);

  if (tokens.length === 0) {
    return { entries: [], ambiguous: false };
  }

  // Load all priors to search their statements
  const priorsByEntry = new Map<string, Prior>();
  const seenArtifacts = new Set<string>();

  for (const entry of priorIndex.entries) {
    if (seenArtifacts.has(entry.artifact_path)) {
      continue;
    }
    seenArtifacts.add(entry.artifact_path);

    try {
      const markdown = fs.readFileSync(entry.artifact_path, 'utf-8');
      const priors = extractPriors(markdown);
      for (const prior of priors) {
        const key = `${entry.artifact_path}#${prior.id}`;
        priorsByEntry.set(key, prior);
      }
    } catch (error) {
      // Skip artifacts that can't be read
      continue;
    }
  }

  // Score each index entry by token matches
  const scored: Array<{
    entry: (typeof priorIndex.entries)[0];
    score: number;
  }> = [];

  for (const indexEntry of priorIndex.entries) {
    const key = `${indexEntry.artifact_path}#${indexEntry.prior_id}`;
    const prior = priorsByEntry.get(key);

    if (!prior) {
      continue;
    }

    // Match tokens against prior_id and statement
    const searchText = `${prior.id} ${prior.statement}`.toLowerCase();
    let score = 0;

    for (const token of tokens) {
      if (searchText.includes(token)) {
        score++;
      }
    }

    if (score >= 2) {
      // Require at least 2 token matches
      scored.push({ entry: indexEntry, score });
    }
  }

  if (scored.length === 0) {
    return { entries: [], ambiguous: false };
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Check if top matches tie (ambiguous)
  const topScore = scored[0].score;
  const topMatches = scored.filter(s => s.score === topScore);

  return {
    entries: topMatches.map(s => s.entry),
    ambiguous: topMatches.length > 1,
  };
}

/**
 * Compute confidence delta based on verdict and confidence level.
 */
function computeDelta(
  verdict: ExperimentReadout['verdict'],
  confidence: ExperimentReadout['confidence']
): number {
  const weight = CONFIDENCE_WEIGHTS[confidence];

  if (verdict === 'PASS') {
    return 0.2 * weight;
  } else if (verdict === 'FAIL') {
    return -0.3 * weight;
  } else {
    // INCONCLUSIVE
    return 0;
  }
}

/**
 * Clamp confidence value to [0.0, 1.0] range.
 */
function clampConfidence(value: number): number {
  return Math.max(0.0, Math.min(1.0, value));
}

/**
 * Load a prior from an artifact by prior_id.
 */
function loadPrior(artifactPath: string, priorId: string): Prior | null {
  try {
    const markdown = fs.readFileSync(artifactPath, 'utf-8');
    const priors = extractPriors(markdown);
    return priors.find(p => p.id === priorId) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Compile an experiment readout into a learning ledger entry with prior deltas.
 *
 * @param readout - Experiment readout to compile
 * @param priorIndex - Index of available priors
 * @param options - Optional configuration (e.g., baseDir)
 * @returns Compiler result with learning entry, deltas, and diagnostics
 */
export function compileExperimentLearning(
  readout: ExperimentReadout,
  priorIndex: PriorIndex,
  options?: { baseDir?: string }
): CompilerResult {
  const diagnostics: string[] = [];
  const priorDeltas: PriorDelta[] = [];

  // Compute readout digest
  const readoutDigest = computeReadoutDigest(readout);

  // Compute entry_id
  const entryId = computeEntryId(
    readout.run_id,
    readout.experiment_id,
    readoutDigest
  );

  // Route to priors based on prior_refs presence
  let targetEntries: typeof priorIndex.entries = [];
  let mappingMode: 'exact' | 'keyword' = 'exact';
  let hasAmbiguousMatch = false;

  if (readout.prior_refs && readout.prior_refs.length > 0) {
    // Explicit prior references
    for (const ref of readout.prior_refs) {
      const resolved = resolvePriorRef(ref, priorIndex);
      if (resolved.entries.length === 0) {
        diagnostics.push(`Prior ref not found: ${ref}`);
      } else {
        targetEntries.push(...resolved.entries);
      }
    }
  } else {
    // Keyword fallback
    mappingMode = 'keyword';
    const matched = keywordMatchPriors(
      readout.experiment_id,
      priorIndex,
      options
    );
    targetEntries = matched.entries;
    hasAmbiguousMatch = matched.ambiguous;

    if (matched.ambiguous) {
      diagnostics.push(
        `Ambiguous keyword match for experiment "${readout.experiment_id}": ` +
          `${matched.entries.length} priors matched with same score`
      );
    }

    if (targetEntries.length === 0) {
      diagnostics.push(
        `No matching priors found for experiment "${readout.experiment_id}"`
      );
    }
  }

  // Compute deltas for each target prior
  const affectedPriors: string[] = [];

  for (const entry of targetEntries) {
    // Load prior to get current confidence
    const prior = loadPrior(entry.artifact_path, entry.prior_id);
    if (!prior) {
      diagnostics.push(
        `Failed to load prior ${entry.prior_id} from ${entry.artifact_path}`
      );
      continue;
    }

    const oldConfidence = prior.confidence;
    const delta = computeDelta(readout.verdict, readout.confidence);
    const newConfidence = clampConfidence(oldConfidence + delta);

    const priorDelta: PriorDelta = {
      prior_id: entry.prior_id,
      artifact_path: entry.artifact_path,
      old_confidence: oldConfidence,
      new_confidence: newConfidence,
      delta,
      reason: `Experiment ${readout.experiment_id} verdict: ${readout.verdict} (${readout.confidence})`,
      evidence_ref: readout.readout_path,
      mapping_confidence:
        mappingMode === 'exact'
          ? 'exact'
          : hasAmbiguousMatch
            ? 'ambiguous'
            : 'keyword',
    };

    priorDeltas.push(priorDelta);
    affectedPriors.push(entry.prior_id);
  }

  // Generate prior_deltas_path using first 8 chars of entry_id
  const entryIdPrefix = entryId.substring(0, 8);
  const priorDeltasPath = `prior-deltas-${entryIdPrefix}.json`;

  // Build learning entry
  const learningEntry: Omit<LearningEntry, 'created_at'> = {
    schema_version: 1,
    entry_id: entryId,
    run_id: readout.run_id,
    experiment_id: readout.experiment_id,
    readout_path: readout.readout_path,
    readout_digest: readoutDigest,
    verdict: readout.verdict,
    confidence: readout.confidence,
    affected_priors: affectedPriors,
    prior_deltas_path: priorDeltasPath,
  };

  return {
    learningEntry,
    priorDeltas,
    mappingDiagnostics: diagnostics,
  };
}
