import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { LearningEntry } from '../learning-ledger';
import { appendLearningEntry, queryLearningEntries } from '../learning-ledger';

describe('learning-ledger', () => {
  let testDir: string;
  let business: string;

  beforeEach(() => {
    // Create fresh temp directory for each test
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-ledger-test-'));
    business = 'TEST';

    // Set up baseline directory structure
    const baselineDir = path.join(testDir, 'docs/business-os/startup-baselines', business);
    fs.mkdirSync(baselineDir, { recursive: true });

    // Mock the baseline directory path for testing
    process.env.TEST_BASELINE_ROOT = testDir;
  });

  afterEach(() => {
    // Clean up temp directory
    if (testDir && fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    delete process.env.TEST_BASELINE_ROOT;
  });

  // TC-01 (VC-LC-02-01): Append 3 unique entries → 3 valid JSONL lines
  test('TC-01: append 3 unique entries creates 3 valid JSONL lines', () => {
    const entry1: LearningEntry = {
      schema_version: 1,
      entry_id: 'entry1_abc123',
      run_id: 'SFS-TEST-20260213-1200',
      experiment_id: 'exp1',
      readout_path: 'docs/business-os/strategy/TEST/readout1.md',
      readout_digest: 'digest1',
      created_at: '2026-02-13T12:00:00Z',
      verdict: 'PASS',
      confidence: 'HIGH',
      affected_priors: ['prior1'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entry1.json',
    };

    const entry2: LearningEntry = {
      schema_version: 1,
      entry_id: 'entry2_def456',
      run_id: 'SFS-TEST-20260213-1300',
      experiment_id: 'exp2',
      readout_path: 'docs/business-os/strategy/TEST/readout2.md',
      readout_digest: 'digest2',
      created_at: '2026-02-13T13:00:00Z',
      verdict: 'FAIL',
      confidence: 'MEDIUM',
      affected_priors: ['prior2'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entry2.json',
    };

    const entry3: LearningEntry = {
      schema_version: 1,
      entry_id: 'entry3_ghi789',
      run_id: 'SFS-TEST-20260213-1400',
      experiment_id: 'exp3',
      readout_path: 'docs/business-os/strategy/TEST/readout3.md',
      readout_digest: 'digest3',
      created_at: '2026-02-13T14:00:00Z',
      verdict: 'INCONCLUSIVE',
      confidence: 'LOW',
      affected_priors: ['prior3'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entry3.json',
    };

    const result1 = appendLearningEntry(business, entry1);
    const result2 = appendLearningEntry(business, entry2);
    const result3 = appendLearningEntry(business, entry3);

    expect(result1.appended).toBe(true);
    expect(result2.appended).toBe(true);
    expect(result3.appended).toBe(true);

    // Verify JSONL file has 3 lines
    const ledgerPath = path.join(
      testDir,
      'docs/business-os/startup-baselines',
      business,
      'learning-ledger.jsonl'
    );
    expect(fs.existsSync(ledgerPath)).toBe(true);

    const content = fs.readFileSync(ledgerPath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(3);

    // Verify each line is valid JSON
    const parsed = lines.map(line => JSON.parse(line));
    expect(parsed[0].entry_id).toBe('entry1_abc123');
    expect(parsed[1].entry_id).toBe('entry2_def456');
    expect(parsed[2].entry_id).toBe('entry3_ghi789');
  });

  // TC-02 (VC-LC-02-02): Append same entry_id twice → one stored entry (dedup)
  test('TC-02: append same entry_id twice results in one stored entry', () => {
    const entry: LearningEntry = {
      schema_version: 1,
      entry_id: 'duplicate_entry_123',
      run_id: 'SFS-TEST-20260213-1200',
      experiment_id: 'exp1',
      readout_path: 'docs/business-os/strategy/TEST/readout1.md',
      readout_digest: 'digest1',
      created_at: '2026-02-13T12:00:00Z',
      verdict: 'PASS',
      confidence: 'HIGH',
      affected_priors: ['prior1'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entry1.json',
    };

    const result1 = appendLearningEntry(business, entry);
    const result2 = appendLearningEntry(business, entry);

    expect(result1.appended).toBe(true);
    expect(result2.appended).toBe(false); // Dedup prevents second append

    // Verify ledger has only 1 line
    const ledgerPath = path.join(
      testDir,
      'docs/business-os/startup-baselines',
      business,
      'learning-ledger.jsonl'
    );
    const content = fs.readFileSync(ledgerPath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(1);

    const parsed = JSON.parse(lines[0]);
    expect(parsed.entry_id).toBe('duplicate_entry_123');
  });

  // TC-03 (VC-LC-02-03): Append correction with supersedes_entry_id → `all` returns both, `effective` returns latest only
  test('TC-03: supersede semantics - all returns both, effective returns latest only', () => {
    const entryA: LearningEntry = {
      schema_version: 1,
      entry_id: 'entry_a_original',
      run_id: 'SFS-TEST-20260213-1200',
      experiment_id: 'exp1',
      readout_path: 'docs/business-os/strategy/TEST/readout1.md',
      readout_digest: 'digest1',
      created_at: '2026-02-13T12:00:00Z',
      verdict: 'PASS',
      confidence: 'HIGH',
      affected_priors: ['prior1'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entryA.json',
    };

    const entryB: LearningEntry = {
      schema_version: 1,
      entry_id: 'entry_b_correction',
      run_id: 'SFS-TEST-20260215-1400',
      experiment_id: 'exp1',
      readout_path: 'docs/business-os/strategy/TEST/readout1-correction.md',
      readout_digest: 'digest2',
      created_at: '2026-02-15T14:00:00Z',
      verdict: 'FAIL',
      confidence: 'HIGH',
      affected_priors: ['prior1'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entryB.json',
      supersedes_entry_id: 'entry_a_original',
    };

    appendLearningEntry(business, entryA);
    appendLearningEntry(business, entryB);

    const allEntries = queryLearningEntries(business, 'all');
    const effectiveEntries = queryLearningEntries(business, 'effective');

    // All view returns both entries
    expect(allEntries.length).toBe(2);
    expect(allEntries[0].entry_id).toBe('entry_a_original');
    expect(allEntries[1].entry_id).toBe('entry_b_correction');

    // Effective view returns only the latest (non-superseded)
    expect(effectiveEntries.length).toBe(1);
    expect(effectiveEntries[0].entry_id).toBe('entry_b_correction');
  });

  // TC-04 (VC-LC-02-04): Broken supersede reference (supersedes non-existent entry_id) → validation warning but still appends
  test('TC-04: broken supersede reference warns but still appends', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const entry: LearningEntry = {
      schema_version: 1,
      entry_id: 'entry_with_broken_ref',
      run_id: 'SFS-TEST-20260213-1200',
      experiment_id: 'exp1',
      readout_path: 'docs/business-os/strategy/TEST/readout1.md',
      readout_digest: 'digest1',
      created_at: '2026-02-13T12:00:00Z',
      verdict: 'PASS',
      confidence: 'HIGH',
      affected_priors: ['prior1'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entry1.json',
      supersedes_entry_id: 'non_existent_entry_id',
    };

    const result = appendLearningEntry(business, entry);

    // Entry should still be appended
    expect(result.appended).toBe(true);

    // Warning should be logged
    expect(consoleWarnSpy).toHaveBeenCalled();
    const warnCall = consoleWarnSpy.mock.calls[0][0];
    expect(warnCall).toContain('supersedes_entry_id');
    expect(warnCall).toContain('non_existent_entry_id');
    expect(warnCall).toContain('non-existent entry');

    consoleWarnSpy.mockRestore();
  });

  // Additional test: Chronological ordering
  test('query returns entries in chronological order (oldest first)', () => {
    const entry1: LearningEntry = {
      schema_version: 1,
      entry_id: 'entry1',
      run_id: 'SFS-TEST-20260213-1400',
      experiment_id: 'exp1',
      readout_path: 'docs/business-os/strategy/TEST/readout1.md',
      readout_digest: 'digest1',
      created_at: '2026-02-13T14:00:00Z',
      verdict: 'PASS',
      confidence: 'HIGH',
      affected_priors: ['prior1'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entry1.json',
    };

    const entry2: LearningEntry = {
      schema_version: 1,
      entry_id: 'entry2',
      run_id: 'SFS-TEST-20260213-1200',
      experiment_id: 'exp2',
      readout_path: 'docs/business-os/strategy/TEST/readout2.md',
      readout_digest: 'digest2',
      created_at: '2026-02-13T12:00:00Z',
      verdict: 'FAIL',
      confidence: 'MEDIUM',
      affected_priors: ['prior2'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entry2.json',
    };

    const entry3: LearningEntry = {
      schema_version: 1,
      entry_id: 'entry3',
      run_id: 'SFS-TEST-20260213-1300',
      experiment_id: 'exp3',
      readout_path: 'docs/business-os/strategy/TEST/readout3.md',
      readout_digest: 'digest3',
      created_at: '2026-02-13T13:00:00Z',
      verdict: 'INCONCLUSIVE',
      confidence: 'LOW',
      affected_priors: ['prior3'],
      prior_deltas_path: 'docs/business-os/startup-baselines/TEST/deltas/entry3.json',
    };

    // Append in non-chronological order
    appendLearningEntry(business, entry1);
    appendLearningEntry(business, entry2);
    appendLearningEntry(business, entry3);

    const allEntries = queryLearningEntries(business, 'all');

    // Should be returned in chronological order (oldest first)
    expect(allEntries.length).toBe(3);
    expect(allEntries[0].entry_id).toBe('entry2'); // 12:00
    expect(allEntries[1].entry_id).toBe('entry3'); // 13:00
    expect(allEntries[2].entry_id).toBe('entry1'); // 14:00
  });
});
