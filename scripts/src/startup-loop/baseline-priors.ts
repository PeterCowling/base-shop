/**
 * Baseline Priors Extraction/Indexing/Serialization
 *
 * Canonical module for extracting priors from baseline artifact markdown files,
 * building an index across multiple artifacts, and serializing priors back to
 * the machine block format.
 *
 * Task: LC-03 from docs/plans/learning-compiler-plan.md
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Prior representation extracted from baseline artifacts.
 */
export interface Prior {
  id: string;
  type: 'assumption' | 'constraint' | 'target' | 'preference' | 'risk';
  statement: string;
  confidence: number;
  value?: number | null;
  unit?: string | null;
  operator?: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | null;
  range?: { min: number; max: number } | null;
  last_updated: string;
  evidence: string[];
}

/**
 * Pointer to a baseline artifact with its scope identifier.
 */
export interface ManifestPointer {
  artifact_scope: string; // e.g. "forecast", "offer", "channels"
  artifact_path: string; // absolute path to artifact markdown file
}

/**
 * Index entry for a single prior.
 */
export interface PriorIndexEntry {
  prior_id: string;
  artifact_scope: string;
  artifact_path: string;
  qualified_ref: string; // "artifact_scope#prior_id"
}

/**
 * Index of all priors across multiple artifacts.
 */
export interface PriorIndex {
  entries: PriorIndexEntry[];
  by_id: Map<string, PriorIndexEntry[]>; // grouped by bare prior_id
}

/**
 * Extract priors from the machine block in a baseline artifact.
 * Only reads the `## Priors (Machine)` section with JSON code fence.
 *
 * @param markdown - Full markdown content of the artifact
 * @returns Array of priors extracted from the machine block
 * @throws Error if machine block is missing, empty, or contains invalid JSON
 */
export function extractPriors(markdown: string): Prior[] {
  // Find the Priors (Machine) section
  const machineBlockRegex = /## Priors \(Machine\)[\s\S]*?```json\s*([\s\S]*?)```/;
  const match = markdown.match(machineBlockRegex);

  if (!match) {
    throw new Error('No Priors (Machine) block found in markdown');
  }

  const jsonContent = match[1].trim();

  if (!jsonContent) {
    throw new Error('Priors (Machine) block is empty');
  }

  try {
    const priors = JSON.parse(jsonContent);

    if (!Array.isArray(priors)) {
      throw new Error('Priors must be an array');
    }

    return priors;
  } catch (e) {
    throw new Error(`Failed to parse priors JSON: ${e}`);
  }
}

/**
 * Serialize priors back into the machine block format.
 * Returns the full `## Priors (Machine)` section with metadata and JSON fence.
 *
 * @param priors - Array of priors to serialize
 * @param timestamp - Optional timestamp string (defaults to current date)
 * @returns Formatted machine block section
 */
export function serializePriors(priors: Prior[], timestamp?: string): string {
  const updatedTimestamp =
    timestamp || new Date().toISOString().split('T')[0] + ' 12:00 UTC';
  const jsonContent = JSON.stringify(priors, null, 2);

  return `## Priors (Machine)

Last updated: ${updatedTimestamp}

\`\`\`json
${jsonContent}
\`\`\``;
}

/**
 * Replace the machine block in original markdown with new priors.
 *
 * @param originalMarkdown - Full markdown content with existing machine block
 * @param newMachineBlock - New machine block section to replace with
 * @returns Updated markdown with replaced machine block
 */
export function replaceMachineBlock(
  originalMarkdown: string,
  newMachineBlock: string
): string {
  const machineBlockRegex = /## Priors \(Machine\)[\s\S]*?```json\s*[\s\S]*?```/;
  return originalMarkdown.replace(machineBlockRegex, newMachineBlock);
}

/**
 * Build a prior index from multiple baseline artifacts.
 * Reads each artifact, extracts priors, and builds routing metadata.
 *
 * @param pointers - Array of manifest pointers to baseline artifacts
 * @param baseDir - Optional base directory for resolving relative paths
 * @returns Prior index with entries and by_id grouping
 */
export function buildPriorIndex(
  pointers: ManifestPointer[],
  baseDir?: string
): PriorIndex {
  const entries: PriorIndexEntry[] = [];
  const byId = new Map<string, PriorIndexEntry[]>();

  for (const pointer of pointers) {
    // Resolve path (use baseDir if provided, otherwise use absolute path)
    const artifactPath = baseDir
      ? path.resolve(baseDir, pointer.artifact_path)
      : pointer.artifact_path;

    // Read artifact file
    let markdown: string;
    try {
      markdown = fs.readFileSync(artifactPath, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to read artifact at ${artifactPath}: ${error}`
      );
    }

    // Extract priors
    let priors: Prior[];
    try {
      priors = extractPriors(markdown);
    } catch (error) {
      throw new Error(
        `Failed to extract priors from ${artifactPath}: ${error}`
      );
    }

    // Build index entries
    for (const prior of priors) {
      const entry: PriorIndexEntry = {
        prior_id: prior.id,
        artifact_scope: pointer.artifact_scope,
        artifact_path: pointer.artifact_path,
        qualified_ref: `${pointer.artifact_scope}#${prior.id}`,
      };

      entries.push(entry);

      // Group by bare prior_id
      const existing = byId.get(prior.id) || [];
      existing.push(entry);
      byId.set(prior.id, existing);
    }
  }

  return { entries, by_id: byId };
}

/**
 * Validate that no bare prior_id appears in multiple artifacts.
 * Throws if any ambiguous references are found.
 *
 * @param index - Prior index to validate
 * @throws Error if duplicate bare prior_ids are detected
 */
export function validateNoDuplicateBareIds(index: PriorIndex): void {
  const duplicates: string[] = [];

  Array.from(index.by_id.entries()).forEach(([priorId, entries]) => {
    if (entries.length > 1) {
      const scopes = entries.map(e => e.artifact_scope).join(', ');
      duplicates.push(`  - "${priorId}" appears in: ${scopes}`);
    }
  });

  if (duplicates.length > 0) {
    const errorMsg = [
      'Ambiguous prior references detected. The following bare prior_ids appear in multiple artifacts:',
      ...duplicates,
      '',
      'Use scope-qualified references (e.g., "forecast#target.orders") to disambiguate.',
    ].join('\n');

    throw new Error(errorMsg);
  }
}
