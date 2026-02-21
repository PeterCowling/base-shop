/**
 * S10 Learning Hook
 *
 * Integrates the learning compiler into S10 stage with manifest lifecycle
 * and correction handling (supersede flow).
 *
 * Task: LC-06 from docs/plans/archive/learning-compiler-plan.md
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  buildPriorIndex,
  type ManifestPointer,
  type PriorIndex,
} from './baseline-priors';
import {
  compileExperimentLearning,
  type CompilerResult,
  type ExperimentReadout,
} from './learning-compiler';
import {
  appendLearningEntry,
  type LearningEntry,
  queryLearningEntries,
} from './learning-ledger';
import {
  applyPriorDeltas,
  computeSnapshotPath,
  type PriorDelta,
} from './prior-update-writer';

/**
 * Extended experiment readout with supersede support.
 */
export interface S10LearningInput extends ExperimentReadout {
  supersedes_entry_id?: string;
}

/**
 * Result of the S10 learning compilation.
 */
export interface S10LearningResult {
  status: 'success' | 'partial' | 'error';
  entry_id: string | null;
  ledger_appended: boolean;
  prior_deltas_path: string | null;
  updated_baselines: string[];
  manifest_updated: boolean;
  compiler_diagnostics: string[];
  warnings: string[];
  error?: string;
}

/**
 * Manifest structure for baseline artifacts.
 */
interface BaselineManifest {
  run_id: string;
  baselines: ManifestPointer[];
  next_seed?: Record<string, string>;
}

/**
 * Stage result structure for S10.
 */
interface StageResult {
  learning_ledger: string;
  prior_deltas_path: string | null;
  updated_baselines: string[];
  compiler_diagnostics: {
    mapping_diagnostics: string[];
    warnings: string[];
  };
}

/**
 * Validate readout has all required fields.
 */
function validateReadout(readout: S10LearningInput): string | null {
  if (!readout.experiment_id) {
    return 'Missing required field: experiment_id';
  }
  if (!readout.run_id) {
    return 'Missing required field: run_id';
  }
  if (!readout.readout_path) {
    return 'Missing required field: readout_path';
  }
  if (!readout.verdict) {
    return 'Missing required field: verdict';
  }
  if (!readout.confidence) {
    return 'Missing required field: confidence';
  }

  const validVerdicts = ['PASS', 'FAIL', 'INCONCLUSIVE'];
  if (!validVerdicts.includes(readout.verdict)) {
    return `Invalid verdict: ${readout.verdict}. Must be one of: ${validVerdicts.join(', ')}`;
  }

  const validConfidences = ['HIGH', 'MEDIUM', 'LOW'];
  if (!validConfidences.includes(readout.confidence)) {
    return `Invalid confidence: ${readout.confidence}. Must be one of: ${validConfidences.join(', ')}`;
  }

  return null;
}

/**
 * Invert prior deltas (swap old/new confidence, negate delta).
 */
function invertPriorDeltas(deltas: PriorDelta[]): PriorDelta[] {
  return deltas.map((delta) => ({
    ...delta,
    old_confidence: delta.new_confidence,
    new_confidence: delta.old_confidence,
    delta: -delta.delta,
    reason: `[SUPERSEDE INVERSION] ${delta.reason}`,
  }));
}

/**
 * Get paths to baseline directories.
 */
function getBaselinePaths(
  business: string,
  runId: string
): { baseDir: string; manifestPath: string; stageResultPath: string } {
  const baseRoot = process.env.TEST_BASELINE_ROOT || process.cwd();
  const baseDir = path.join(
    baseRoot,
    'docs/business-os/startup-baselines',
    business,
    'runs',
    runId
  );
  const manifestPath = path.join(baseDir, 'baseline.manifest.json');
  const stageResultPath = path.join(baseDir, 'stages/S10/stage-result.json');

  return { baseDir, manifestPath, stageResultPath };
}

/**
 * Load baseline manifest.
 */
function loadManifest(manifestPath: string): BaselineManifest {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const content = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(content) as BaselineManifest;
}

/**
 * Write updated manifest with next_seed pointers.
 */
function updateManifest(
  manifestPath: string,
  snapshotPaths: string[]
): void {
  const manifest = loadManifest(manifestPath);

  // Build next_seed map from snapshot paths
  const nextSeed: Record<string, string> = {};
  for (const snapshotPath of snapshotPaths) {
    const basename = path.basename(snapshotPath);
    // Extract artifact scope from snapshot name (e.g., "baseline-forecast.abc123de.snapshot.md" -> "forecast")
    const match = basename.match(/^baseline-([^.]+)\./);
    if (match) {
      nextSeed[match[1]] = snapshotPath;
    }
  }

  manifest.next_seed = nextSeed;

  // Write atomically
  const tempPath = manifestPath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2), 'utf-8');
  fs.renameSync(tempPath, manifestPath);
}

/**
 * Write stage result artifact.
 */
function writeStageResult(
  stageResultPath: string,
  options: {
    priorDeltasPath: string | null;
    updatedBaselines: string[];
    mappingDiagnostics: string[];
    warnings: string[];
  }
): void {
  const stageResult: StageResult = {
    learning_ledger: 'learning-ledger.jsonl',
    prior_deltas_path: options.priorDeltasPath,
    updated_baselines: options.updatedBaselines,
    compiler_diagnostics: {
      mapping_diagnostics: options.mappingDiagnostics,
      warnings: options.warnings,
    },
  };

  // Ensure directory exists
  const stageDir = path.dirname(stageResultPath);
  if (!fs.existsSync(stageDir)) {
    fs.mkdirSync(stageDir, { recursive: true });
  }

  fs.writeFileSync(stageResultPath, JSON.stringify(stageResult, null, 2), 'utf-8');
}

/**
 * Run the full learning compilation for S10 completion.
 *
 * Orchestrates:
 * 1. Build prior index from manifest
 * 2. Compile experiment readout
 * 3. Append learning entry to ledger
 * 4. Write prior-delta artifact
 * 5. Apply deltas to baseline artifacts (with supersede support)
 * 6. Update manifest next_seed pointers
 * 7. Write stage-result artifact
 */
export function runLearningCompilation(
  readout: S10LearningInput,
  business: string,
  options?: { baseDir?: string }
): S10LearningResult {
  const warnings: string[] = [];
  const compilerDiagnostics: string[] = [];
  let ledgerAppended = false;

  // Validate readout
  const validationError = validateReadout(readout);
  if (validationError) {
    return {
      status: 'error',
      entry_id: null,
      ledger_appended: false,
      prior_deltas_path: null,
      updated_baselines: [],
      manifest_updated: false,
      compiler_diagnostics: [],
      warnings: [],
      error: validationError,
    };
  }

  try {
    // Get paths
    const { baseDir, manifestPath, stageResultPath } = getBaselinePaths(
      business,
      readout.run_id
    );

    // Load manifest
    let manifest: BaselineManifest;
    try {
      manifest = loadManifest(manifestPath);
    } catch (error) {
      return {
        status: 'error',
        entry_id: null,
        ledger_appended: false,
        prior_deltas_path: null,
        updated_baselines: [],
        manifest_updated: false,
        compiler_diagnostics: [],
        warnings: [],
        error: `Failed to load manifest: ${error}`,
      };
    }

    // Build prior index
    let priorIndex: PriorIndex;
    try {
      priorIndex = buildPriorIndex(manifest.baselines, options?.baseDir);
    } catch (error) {
      return {
        status: 'error',
        entry_id: null,
        ledger_appended: false,
        prior_deltas_path: null,
        updated_baselines: [],
        manifest_updated: false,
        compiler_diagnostics: [],
        warnings: [],
        error: `Failed to build prior index: ${error}`,
      };
    }

    // Compile experiment readout
    let compilerResult: CompilerResult;
    try {
      compilerResult = compileExperimentLearning(
        readout,
        priorIndex,
        options
      );
      compilerDiagnostics.push(...compilerResult.mappingDiagnostics);
    } catch (error) {
      return {
        status: 'error',
        entry_id: null,
        ledger_appended: false,
        prior_deltas_path: null,
        updated_baselines: [],
        manifest_updated: false,
        compiler_diagnostics: [],
        warnings: [],
        error: `Compilation failed: ${error}`,
      };
    }

    // Add created_at timestamp
    const learningEntryWithTimestamp: LearningEntry = {
      ...compilerResult.learningEntry,
      created_at: new Date().toISOString(),
      ...(readout.supersedes_entry_id && {
        supersedes_entry_id: readout.supersedes_entry_id,
      }),
    };

    // Append to ledger
    try {
      const appendResult = appendLearningEntry(
        business,
        learningEntryWithTimestamp
      );
      ledgerAppended = appendResult.appended;

      if (!ledgerAppended) {
        // Duplicate entry, idempotent behavior
        return {
          status: 'partial',
          entry_id: compilerResult.learningEntry.entry_id,
          ledger_appended: false,
          prior_deltas_path: null,
          updated_baselines: [],
          manifest_updated: false,
          compiler_diagnostics: compilerDiagnostics,
          warnings: ['Entry already exists in ledger (idempotent rerun)'],
          error: undefined,
        };
      }
    } catch (error) {
      return {
        status: 'error',
        entry_id: compilerResult.learningEntry.entry_id,
        ledger_appended: false,
        prior_deltas_path: null,
        updated_baselines: [],
        manifest_updated: false,
        compiler_diagnostics: compilerDiagnostics,
        warnings,
        error: `Failed to append to ledger: ${error}`,
      };
    }

    // Write prior-delta artifact
    const priorDeltasPath = path.join(
      baseDir,
      compilerResult.learningEntry.prior_deltas_path
    );
    try {
      fs.writeFileSync(
        priorDeltasPath,
        JSON.stringify(compilerResult.priorDeltas, null, 2),
        'utf-8'
      );
    } catch (error) {
      warnings.push(`Failed to write prior-deltas artifact: ${error}`);
    }

    // Handle supersede flow + apply deltas
    const updatedBaselines: string[] = [];
    let manifestUpdated = false;

    if (compilerResult.priorDeltas.length > 0) {
      try {
        // Group deltas by artifact
        const deltasByArtifact = new Map<string, PriorDelta[]>();
        for (const delta of compilerResult.priorDeltas) {
          const existing = deltasByArtifact.get(delta.artifact_path) || [];
          existing.push(delta);
          deltasByArtifact.set(delta.artifact_path, existing);
        }

        // If superseding, first invert the superseded deltas
        if (readout.supersedes_entry_id) {
          try {
            const allEntries = queryLearningEntries(business, 'all');
            const supersededEntry = allEntries.find(
              (e) => e.entry_id === readout.supersedes_entry_id
            );

            if (supersededEntry) {
              // Load superseded deltas
              const supersededDeltasPath = path.join(
                baseDir,
                supersededEntry.prior_deltas_path
              );

              if (fs.existsSync(supersededDeltasPath)) {
                const supersededDeltasContent = fs.readFileSync(
                  supersededDeltasPath,
                  'utf-8'
                );
                const supersededDeltas = JSON.parse(
                  supersededDeltasContent
                ) as PriorDelta[];

                // Group superseded deltas by artifact
                const supersededByArtifact = new Map<string, PriorDelta[]>();
                for (const delta of supersededDeltas) {
                  const existing =
                    supersededByArtifact.get(delta.artifact_path) || [];
                  existing.push(delta);
                  supersededByArtifact.set(delta.artifact_path, existing);
                }

                // Apply inversions first
                for (const [artifactPath, deltas] of supersededByArtifact) {
                  const invertedDeltas = invertPriorDeltas(deltas);
                  const snapshotPath = applyPriorDeltas(
                    artifactPath,
                    invertedDeltas,
                    `${readout.supersedes_entry_id}-inv`
                  );
                  updatedBaselines.push(snapshotPath);
                }
              } else {
                warnings.push(
                  `Superseded deltas file not found: ${supersededDeltasPath}`
                );
              }
            } else {
              warnings.push(
                `Superseded entry not found in ledger: ${readout.supersedes_entry_id}`
              );
            }
          } catch (error) {
            warnings.push(`Failed to apply supersede inversions: ${error}`);
          }
        }

        // Apply new deltas
        for (const [artifactPath, deltas] of deltasByArtifact) {
          try {
            const snapshotPath = applyPriorDeltas(
              artifactPath,
              deltas,
              compilerResult.learningEntry.entry_id
            );
            updatedBaselines.push(snapshotPath);
          } catch (error) {
            warnings.push(
              `Failed to apply deltas for ${artifactPath}: ${error}`
            );
          }
        }

        // Update manifest if we have snapshots
        if (updatedBaselines.length > 0) {
          try {
            updateManifest(manifestPath, updatedBaselines);
            manifestUpdated = true;
          } catch (error) {
            warnings.push(`Failed to update manifest: ${error}`);
          }
        }
      } catch (error) {
        warnings.push(`Failed during delta application: ${error}`);
      }
    }

    // Write stage-result artifact
    try {
      writeStageResult(stageResultPath, {
        priorDeltasPath: compilerResult.learningEntry.prior_deltas_path,
        updatedBaselines,
        mappingDiagnostics: compilerDiagnostics,
        warnings,
      });
    } catch (error) {
      warnings.push(`Failed to write stage-result: ${error}`);
    }

    // Determine final status
    const status =
      warnings.length > 0 || !ledgerAppended ? 'partial' : 'success';

    return {
      status,
      entry_id: compilerResult.learningEntry.entry_id,
      ledger_appended: ledgerAppended,
      prior_deltas_path: compilerResult.learningEntry.prior_deltas_path,
      updated_baselines: updatedBaselines,
      manifest_updated: manifestUpdated,
      compiler_diagnostics: compilerDiagnostics,
      warnings,
      error: undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      entry_id: null,
      ledger_appended: false,
      prior_deltas_path: null,
      updated_baselines: [],
      manifest_updated: false,
      compiler_diagnostics: compilerDiagnostics,
      warnings,
      error: `Unexpected error: ${error}`,
    };
  }
}
