import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  extractPriors,
  type Prior,
  replaceMachineBlock,
  serializePriors,
} from './baseline-priors';

/**
 * Delta representing a confidence update to a prior.
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

export interface ApplyPriorDeltasOptions {
  /**
   * If true, skip integrity check for existing snapshots.
   * Default: false (always verify).
   */
  skipIntegrityCheck?: boolean;
}

/**
 * Computes the deterministic snapshot path for a given source artifact and entry ID.
 *
 * Format: <source_dir>/<source_basename>.<entry_id_prefix>.snapshot.md
 * where entry_id_prefix is the first 8 characters of the entry ID.
 */
export function computeSnapshotPath(
  sourceArtifactPath: string,
  entryId: string
): string {
  const dir = path.dirname(sourceArtifactPath);
  const basename = path.basename(sourceArtifactPath);
  const entryIdPrefix = entryId.slice(0, 8);

  // Remove existing extension and add snapshot extension
  const nameWithoutExt = basename.replace(/\.md$/, '');
  const snapshotName = `${nameWithoutExt}.${entryIdPrefix}.snapshot.md`;

  return path.join(dir, snapshotName);
}

/**
 * Verifies that the content at snapshotPath matches the expected content via SHA-256 hash.
 * Throws an error if the integrity check fails.
 */
export function verifySnapshotIntegrity(
  snapshotPath: string,
  expectedContent: string
): void {
  if (!fs.existsSync(snapshotPath)) {
    return; // No existing file, no integrity issue
  }

  const actualContent = fs.readFileSync(snapshotPath, 'utf-8');
  const actualHash = createHash('sha256').update(actualContent).digest('hex');
  const expectedHash = createHash('sha256')
    .update(expectedContent)
    .digest('hex');

  if (actualHash !== expectedHash) {
    throw new Error(
      `Snapshot integrity check failed for ${snapshotPath}.\n` +
        `Expected hash: ${expectedHash}\n` +
        `Actual hash:   ${actualHash}\n` +
        `The snapshot file exists but its content does not match the expected output. ` +
        `This indicates either concurrent modification or a previous failed write.`
    );
  }
}

/**
 * Applies prior deltas to the source artifact and writes the result to a deterministic snapshot path.
 *
 * The source file is NEVER modified. Only the snapshot is created/updated.
 *
 * Returns the path to the created snapshot file.
 */
export function applyPriorDeltas(
  sourceArtifactPath: string,
  priorDeltas: PriorDelta[],
  entryId: string,
  options: ApplyPriorDeltasOptions = {}
): string {
  const { skipIntegrityCheck = false } = options;

  // 1. Read the source baseline artifact
  const sourceContent = fs.readFileSync(sourceArtifactPath, 'utf-8');

  // 2. Extract priors from the machine block
  const priors = extractPriors(sourceContent);

  // 3. Apply each delta
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  for (const delta of priorDeltas) {
    const prior = priors.find((p) => p.id === delta.prior_id);

    if (!prior) {
      console.warn(
        `[prior-update-writer] Prior ID "${delta.prior_id}" not found in artifact. Skipping delta.`
      );
      continue;
    }

    // Update confidence
    prior.confidence = delta.new_confidence;

    // Update last_updated
    prior.last_updated = today;

    // Append evidence
    if (!prior.evidence) {
      prior.evidence = [];
    }
    prior.evidence.push(delta.evidence_ref);
  }

  // 4. Serialize the updated priors back
  const updatedPriorsJson = serializePriors(priors);

  // 5. Replace the machine block in the source content
  let updatedContent = replaceMachineBlock(sourceContent, updatedPriorsJson);

  // Update the "Last updated" metadata line if present
  const metadataLineRegex = /^Last updated:.*$/m;
  if (metadataLineRegex.test(updatedContent)) {
    updatedContent = updatedContent.replace(
      metadataLineRegex,
      `Last updated: ${new Date().toISOString().replace('T', ' ').split('.')[0]} UTC`
    );
  }

  // 6. Compute the deterministic snapshot path
  const snapshotPath = computeSnapshotPath(sourceArtifactPath, entryId);

  // 7. Verify integrity if snapshot already exists
  if (!skipIntegrityCheck) {
    verifySnapshotIntegrity(snapshotPath, updatedContent);
  }

  // 8. Write atomically (write to temp file, then rename)
  const tmpPath = `${snapshotPath}.tmp`;
  fs.writeFileSync(tmpPath, updatedContent, 'utf-8');
  fs.renameSync(tmpPath, snapshotPath);

  return snapshotPath;
}
