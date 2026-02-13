import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import type { PriorDelta } from '../learning-compiler';
import {
  applyPriorDeltas,
  computeSnapshotPath,
  verifySnapshotIntegrity,
} from '../prior-update-writer';

describe('prior-update-writer', () => {
  let testDir: string;
  let sourceArtifactPath: string;

  const fixtureMarkdown = `# HEAD Forecast Seed

Some narrative text here.

## Priors (Machine)

Last updated: 2026-01-15 12:00 UTC

\`\`\`json
[
  {
    "id": "forecast.target.mrr_month3",
    "type": "target",
    "statement": "MRR target for month 3",
    "confidence": 0.6,
    "value": 5000,
    "unit": "EUR",
    "operator": "gte",
    "range": null,
    "last_updated": "2026-01-15",
    "evidence": ["initial-estimate"]
  },
  {
    "id": "forecast.assumption.churn_rate",
    "type": "assumption",
    "statement": "Monthly churn rate assumption",
    "confidence": 0.7,
    "value": 0.05,
    "unit": "ratio",
    "operator": "lte",
    "range": null,
    "last_updated": "2026-01-15",
    "evidence": ["industry-benchmark"]
  }
]
\`\`\`

## Some Other Section

More narrative text that must not be modified.
`;

  beforeEach(() => {
    testDir = mkdtempSync(path.join(tmpdir(), 'prior-writer-test-'));
    sourceArtifactPath = path.join(testDir, 'HEAD-forecast-seed.user.md');
    fs.writeFileSync(sourceArtifactPath, fixtureMarkdown, 'utf-8');
  });

  afterEach(() => {
    if (testDir) {
      rmSync(testDir, { force: true, recursive: true });
    }
  });

  describe('computeSnapshotPath', () => {
    it('generates deterministic snapshot path with entry ID prefix', () => {
      const entryId = 'a1b2c3d4-5678-90ab-cdef-1234567890ab';
      const expected = path.join(
        testDir,
        'HEAD-forecast-seed.user.a1b2c3d4.snapshot.md'
      );

      const result = computeSnapshotPath(sourceArtifactPath, entryId);

      expect(result).toBe(expected);
    });

    it('handles different entry IDs deterministically', () => {
      const entryId1 = 'aaaabbbb-cccc-dddd-eeee-ffffffffffff';
      const entryId2 = 'zzzzyyyy-xxxx-wwww-vvvv-uuuuuuuuuuuu';

      const result1 = computeSnapshotPath(sourceArtifactPath, entryId1);
      const result2 = computeSnapshotPath(sourceArtifactPath, entryId2);

      expect(result1).toBe(
        path.join(testDir, 'HEAD-forecast-seed.user.aaaabbbb.snapshot.md')
      );
      expect(result2).toBe(
        path.join(testDir, 'HEAD-forecast-seed.user.zzzzyyyy.snapshot.md')
      );
      expect(result1).not.toBe(result2);
    });

    it('uses first 8 chars of entry ID', () => {
      const entryId = 'short123';
      const result = computeSnapshotPath(sourceArtifactPath, entryId);

      expect(result).toBe(
        path.join(testDir, 'HEAD-forecast-seed.user.short123.snapshot.md')
      );
    });
  });

  describe('verifySnapshotIntegrity', () => {
    it('passes when content matches', () => {
      const snapshotPath = path.join(testDir, 'test-snapshot.md');
      const content = 'test content';
      fs.writeFileSync(snapshotPath, content, 'utf-8');

      expect(() =>
        verifySnapshotIntegrity(snapshotPath, content)
      ).not.toThrow();
    });

    it('throws when content hash mismatches', () => {
      const snapshotPath = path.join(testDir, 'test-snapshot.md');
      fs.writeFileSync(snapshotPath, 'actual content', 'utf-8');

      expect(() =>
        verifySnapshotIntegrity(snapshotPath, 'expected content')
      ).toThrow(/integrity check failed/i);
    });
  });

  describe('applyPriorDeltas', () => {
    it('VC-LC-05-01: creates snapshot at deterministic path, source unchanged', () => {
      const entryId = 'a1b2c3d4-5678-90ab-cdef-1234567890ab';
      const deltas: PriorDelta[] = [
        {
          artifact_path: sourceArtifactPath,
          delta: 0.1,
          evidence_ref: 'test-evidence-001',
          mapping_confidence: 'exact',
          new_confidence: 0.7,
          old_confidence: 0.6,
          prior_id: 'forecast.target.mrr_month3',
          reason: 'Updated based on market analysis',
        },
      ];

      const sourceContentBefore = fs.readFileSync(sourceArtifactPath, 'utf-8');

      const snapshotPath = applyPriorDeltas(
        sourceArtifactPath,
        deltas,
        entryId
      );

      const sourceContentAfter = fs.readFileSync(sourceArtifactPath, 'utf-8');
      const expectedSnapshotPath = path.join(
        testDir,
        'HEAD-forecast-seed.user.a1b2c3d4.snapshot.md'
      );

      // Source file unchanged
      expect(sourceContentAfter).toBe(sourceContentBefore);

      // Snapshot created at deterministic path
      expect(snapshotPath).toBe(expectedSnapshotPath);
      expect(fs.existsSync(snapshotPath)).toBe(true);

      // Snapshot contains updated confidence
      const snapshotContent = fs.readFileSync(snapshotPath, 'utf-8');
      const parsedSnapshot = JSON.parse(
        snapshotContent.match(/```json\n([\s\S]*?)\n```/)![1]
      );
      const updatedPrior = parsedSnapshot.find(
        (p: { id: string }) => p.id === 'forecast.target.mrr_month3'
      );

      expect(updatedPrior.confidence).toBe(0.7);
      expect(updatedPrior.evidence).toContain('test-evidence-001');
    });

    it('VC-LC-05-02: diff shows only machine block and metadata changed', () => {
      const entryId = 'b2c3d4e5-6789-01bc-def0-234567890abc';
      const deltas: PriorDelta[] = [
        {
          artifact_path: sourceArtifactPath,
          delta: 0.05,
          evidence_ref: 'test-evidence-002',
          mapping_confidence: 'exact',
          new_confidence: 0.75,
          old_confidence: 0.7,
          prior_id: 'forecast.assumption.churn_rate',
          reason: 'Updated churn rate based on historical data',
        },
      ];

      const snapshotPath = applyPriorDeltas(
        sourceArtifactPath,
        deltas,
        entryId
      );

      const sourceContent = fs.readFileSync(sourceArtifactPath, 'utf-8');
      const snapshotContent = fs.readFileSync(snapshotPath, 'utf-8');

      // Extract sections before machine block
      const beforeMachineSource = sourceContent.split('## Priors (Machine)')[0];
      const beforeMachineSnapshot = snapshotContent.split(
        '## Priors (Machine)'
      )[0];

      // Extract sections after machine block
      const afterMachineSource =
        sourceContent.split('## Some Other Section')[1];
      const afterMachineSnapshot =
        snapshotContent.split('## Some Other Section')[1];

      // All narrative sections unchanged
      expect(beforeMachineSnapshot).toBe(beforeMachineSource);
      expect(afterMachineSnapshot).toBe(afterMachineSource);

      // Machine block content differs
      expect(snapshotContent).not.toBe(sourceContent);
    });

    it('VC-LC-05-03: re-run identical input produces same path and content', () => {
      const entryId = 'c3d4e5f6-789a-12cd-ef01-34567890abcd';
      const deltas: PriorDelta[] = [
        {
          artifact_path: sourceArtifactPath,
          delta: 0.1,
          evidence_ref: 'test-evidence-003',
          mapping_confidence: 'exact',
          new_confidence: 0.7,
          old_confidence: 0.6,
          prior_id: 'forecast.target.mrr_month3',
          reason: 'Deterministic test',
        },
      ];

      const snapshotPath1 = applyPriorDeltas(
        sourceArtifactPath,
        deltas,
        entryId
      );
      const content1 = fs.readFileSync(snapshotPath1, 'utf-8');

      // Re-run with identical inputs
      fs.unlinkSync(snapshotPath1);
      const snapshotPath2 = applyPriorDeltas(
        sourceArtifactPath,
        deltas,
        entryId
      );
      const content2 = fs.readFileSync(snapshotPath2, 'utf-8');

      // Same path
      expect(snapshotPath2).toBe(snapshotPath1);

      // Same content
      expect(content2).toBe(content1);
    });

    it('VC-LC-05-04: existing path with hash mismatch throws integrity error', () => {
      const entryId = 'd4e5f6a7-89ab-23de-f012-4567890abcde';
      const deltas: PriorDelta[] = [
        {
          artifact_path: sourceArtifactPath,
          delta: 0.1,
          evidence_ref: 'test-evidence-004',
          mapping_confidence: 'exact',
          new_confidence: 0.7,
          old_confidence: 0.6,
          prior_id: 'forecast.target.mrr_month3',
          reason: 'Integrity test',
        },
      ];

      const snapshotPath = applyPriorDeltas(
        sourceArtifactPath,
        deltas,
        entryId
      );

      // Modify the snapshot to corrupt it
      fs.writeFileSync(snapshotPath, 'corrupted content', 'utf-8');

      // Re-run should detect the mismatch
      expect(() => {
        applyPriorDeltas(sourceArtifactPath, deltas, entryId);
      }).toThrow(/integrity check failed/i);
    });

    it('applies multiple deltas to different priors', () => {
      const entryId = 'e5f6a7b8-9abc-34ef-0123-567890abcdef';
      const deltas: PriorDelta[] = [
        {
          artifact_path: sourceArtifactPath,
          delta: 0.1,
          evidence_ref: 'evidence-mrr',
          mapping_confidence: 'exact',
          new_confidence: 0.7,
          old_confidence: 0.6,
          prior_id: 'forecast.target.mrr_month3',
          reason: 'MRR update',
        },
        {
          artifact_path: sourceArtifactPath,
          delta: 0.05,
          evidence_ref: 'evidence-churn',
          mapping_confidence: 'exact',
          new_confidence: 0.75,
          old_confidence: 0.7,
          prior_id: 'forecast.assumption.churn_rate',
          reason: 'Churn update',
        },
      ];

      const snapshotPath = applyPriorDeltas(
        sourceArtifactPath,
        deltas,
        entryId
      );

      const snapshotContent = fs.readFileSync(snapshotPath, 'utf-8');
      const parsedSnapshot = JSON.parse(
        snapshotContent.match(/```json\n([\s\S]*?)\n```/)![1]
      );

      const mrrPrior = parsedSnapshot.find(
        (p: { id: string }) => p.id === 'forecast.target.mrr_month3'
      );
      const churnPrior = parsedSnapshot.find(
        (p: { id: string }) => p.id === 'forecast.assumption.churn_rate'
      );

      expect(mrrPrior.confidence).toBe(0.7);
      expect(mrrPrior.evidence).toContain('evidence-mrr');
      expect(churnPrior.confidence).toBe(0.75);
      expect(churnPrior.evidence).toContain('evidence-churn');
    });

    it('skips delta for non-existent prior_id with warning', () => {
      const entryId = 'f6a7b8c9-abcd-45f0-1234-67890abcdef0';
      const deltas: PriorDelta[] = [
        {
          artifact_path: sourceArtifactPath,
          delta: 0.1,
          evidence_ref: 'test-evidence',
          mapping_confidence: 'exact',
          new_confidence: 0.7,
          old_confidence: 0.6,
          prior_id: 'non.existent.prior',
          reason: 'Test non-existent',
        },
      ];

      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const snapshotPath = applyPriorDeltas(
        sourceArtifactPath,
        deltas,
        entryId
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('non.existent.prior')
      );

      // Snapshot still created (no changes to priors)
      expect(fs.existsSync(snapshotPath)).toBe(true);

      consoleWarnSpy.mockRestore();
    });

    it('appends evidence to prior evidence array', () => {
      const entryId = 'a7b8c9d0-bcde-56f1-2345-7890abcdef01';
      const deltas: PriorDelta[] = [
        {
          artifact_path: sourceArtifactPath,
          delta: 0.1,
          evidence_ref: 'new-evidence-item',
          mapping_confidence: 'exact',
          new_confidence: 0.7,
          old_confidence: 0.6,
          prior_id: 'forecast.target.mrr_month3',
          reason: 'Evidence append test',
        },
      ];

      const snapshotPath = applyPriorDeltas(
        sourceArtifactPath,
        deltas,
        entryId
      );

      const snapshotContent = fs.readFileSync(snapshotPath, 'utf-8');
      const parsedSnapshot = JSON.parse(
        snapshotContent.match(/```json\n([\s\S]*?)\n```/)![1]
      );
      const updatedPrior = parsedSnapshot.find(
        (p: { id: string }) => p.id === 'forecast.target.mrr_month3'
      );

      expect(updatedPrior.evidence).toEqual([
        'initial-estimate',
        'new-evidence-item',
      ]);
    });

    it('updates last_updated field on modified prior', () => {
      const entryId = 'b8c9d0e1-cdef-67f2-3456-890abcdef012';
      const deltas: PriorDelta[] = [
        {
          artifact_path: sourceArtifactPath,
          delta: 0.1,
          evidence_ref: 'test-evidence',
          mapping_confidence: 'exact',
          new_confidence: 0.7,
          old_confidence: 0.6,
          prior_id: 'forecast.target.mrr_month3',
          reason: 'Last updated test',
        },
      ];

      const snapshotPath = applyPriorDeltas(
        sourceArtifactPath,
        deltas,
        entryId
      );

      const snapshotContent = fs.readFileSync(snapshotPath, 'utf-8');
      const parsedSnapshot = JSON.parse(
        snapshotContent.match(/```json\n([\s\S]*?)\n```/)![1]
      );
      const updatedPrior = parsedSnapshot.find(
        (p: { id: string }) => p.id === 'forecast.target.mrr_month3'
      );

      // Should be updated to today's date (2026-02-13)
      expect(updatedPrior.last_updated).not.toBe('2026-01-15');
      expect(updatedPrior.last_updated).toMatch(/2026-02-13/);
    });
  });
});
