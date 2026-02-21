import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * LearningEntry schema as defined in learning-ledger-schema.md
 */
export interface LearningEntry {
  schema_version: 1;
  entry_id: string;
  run_id: string;
  experiment_id: string;
  readout_path: string;
  readout_digest: string;
  created_at: string;
  verdict: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  affected_priors: string[];
  prior_deltas_path: string;
  supersedes_entry_id?: string;
}

/**
 * Get the path to the learning ledger for a given business
 */
function getLedgerPath(business: string): string {
  const baseRoot = process.env.TEST_BASELINE_ROOT || process.cwd();
  return path.join(
    baseRoot,
    'docs/business-os/startup-baselines',
    business,
    'learning-ledger.jsonl'
  );
}

/**
 * Read all entries from the learning ledger
 */
function readLedgerEntries(ledgerPath: string): LearningEntry[] {
  if (!fs.existsSync(ledgerPath)) {
    return [];
  }

  const content = fs.readFileSync(ledgerPath, 'utf-8');
  if (!content.trim()) {
    return [];
  }

  return content
    .trim()
    .split('\n')
    .map(line => JSON.parse(line) as LearningEntry);
}

/**
 * Append a learning entry to the ledger.
 * Implements deterministic deduplication based on entry_id.
 *
 * @param business - Business identifier (e.g., 'HEAD', 'BRIK', 'PET')
 * @param entry - Learning entry to append
 * @returns Object indicating whether entry was appended
 */
export function appendLearningEntry(
  business: string,
  entry: LearningEntry
): { appended: boolean } {
  const ledgerPath = getLedgerPath(business);
  const ledgerDir = path.dirname(ledgerPath);

  // Ensure directory exists
  if (!fs.existsSync(ledgerDir)) {
    fs.mkdirSync(ledgerDir, { recursive: true });
  }

  // Read existing entries for dedup check
  const existingEntries = readLedgerEntries(ledgerPath);

  // Check for duplicate entry_id (deduplication)
  const isDuplicate = existingEntries.some(e => e.entry_id === entry.entry_id);
  if (isDuplicate) {
    return { appended: false };
  }

  // Validate supersedes_entry_id if present
  if (entry.supersedes_entry_id) {
    const supersedesExists = existingEntries.some(
      e => e.entry_id === entry.supersedes_entry_id
    );
    if (!supersedesExists) {
      console.warn(
        `[learning-ledger] Warning: supersedes_entry_id '${entry.supersedes_entry_id}' ` +
        `references non-existent entry in ledger for business '${business}'`
      );
    }
  }

  // Atomic write: write to temp file, then rename
  const tempPath = ledgerPath + '.tmp.' + crypto.randomBytes(8).toString('hex');
  const entryLine = JSON.stringify(entry) + '\n';

  try {
    // Append to temp file
    if (fs.existsSync(ledgerPath)) {
      fs.copyFileSync(ledgerPath, tempPath);
    }
    fs.appendFileSync(tempPath, entryLine, 'utf-8');

    // Atomic rename
    fs.renameSync(tempPath, ledgerPath);

    return { appended: true };
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw error;
  }
}

/**
 * Query learning entries from the ledger.
 *
 * @param business - Business identifier
 * @param view - Query view mode:
 *   - 'all': Returns all entries (including superseded)
 *   - 'effective': Returns only non-superseded entries
 * @returns Array of learning entries in chronological order (oldest first)
 */
export function queryLearningEntries(
  business: string,
  view: 'all' | 'effective'
): LearningEntry[] {
  const ledgerPath = getLedgerPath(business);
  const allEntries = readLedgerEntries(ledgerPath);

  // Sort chronologically (oldest first)
  const sortedEntries = allEntries.sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  if (view === 'all') {
    return sortedEntries;
  }

  // Effective view: exclude superseded entries
  // Collect all entry_ids that are superseded
  const supersededIds = new Set<string>();
  for (const entry of allEntries) {
    if (entry.supersedes_entry_id) {
      supersededIds.add(entry.supersedes_entry_id);
    }
  }

  // Filter out superseded entries
  return sortedEntries.filter(entry => !supersededIds.has(entry.entry_id));
}
