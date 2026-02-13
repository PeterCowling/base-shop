/**
 * Tests for s10-learning-hook.ts
 * Task: LC-06 from docs/plans/learning-compiler-plan.md
 */

import * as fs from 'node:fs';

import type { ManifestPointer, PriorIndex } from '../baseline-priors';
import type { CompilerResult } from '../learning-compiler';
import type { LearningEntry } from '../learning-ledger';
import type { PriorDelta } from '../prior-update-writer';
import {
  runLearningCompilation,
  type S10LearningInput,
  type S10LearningResult,
} from '../s10-learning-hook';

// Mock all imported modules
jest.mock('node:fs');
jest.mock('../baseline-priors');
jest.mock('../learning-compiler');
jest.mock('../learning-ledger');
jest.mock('../prior-update-writer');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('s10-learning-hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default fs mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.writeFileSync.mockReturnValue(undefined);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.renameSync.mockReturnValue(undefined);
  });

  describe('VC-LC-06-01: Happy path', () => {
    it('should successfully compile, append, write artifacts, and update manifest', async () => {
      // Import mocked modules
      const { buildPriorIndex } = await import('../baseline-priors');
      const { compileExperimentLearning } = await import('../learning-compiler');
      const { appendLearningEntry } = await import('../learning-ledger');
      const { applyPriorDeltas, computeSnapshotPath } = await import('../prior-update-writer');

      const mockPriorIndex: PriorIndex = {
        entries: [
          {
            prior_id: 'target.orders',
            artifact_scope: 'forecast',
            artifact_path: 'docs/business-os/startup-baselines/BRIK/runs/run-001/baseline-forecast.md',
            qualified_ref: 'forecast#target.orders',
          },
        ],
        by_id: new Map(),
      };

      const mockPriorDeltas: PriorDelta[] = [
        {
          prior_id: 'target.orders',
          artifact_path: 'docs/business-os/startup-baselines/BRIK/runs/run-001/baseline-forecast.md',
          old_confidence: 0.6,
          new_confidence: 0.8,
          delta: 0.2,
          reason: 'Experiment booking-flow-test verdict: PASS (HIGH)',
          evidence_ref: 'docs/business-os/startup-baselines/BRIK/runs/run-001/stages/S10/readouts/booking-flow-test.md',
          mapping_confidence: 'exact',
        },
      ];

      const mockLearningEntry: Omit<LearningEntry, 'created_at'> = {
        schema_version: 1,
        entry_id: 'abc123def456',
        run_id: 'run-001',
        experiment_id: 'booking-flow-test',
        readout_path: 'docs/business-os/startup-baselines/BRIK/runs/run-001/stages/S10/readouts/booking-flow-test.md',
        readout_digest: 'deadbeef',
        verdict: 'PASS',
        confidence: 'HIGH',
        affected_priors: ['target.orders'],
        prior_deltas_path: 'prior-deltas-abc123de.json',
      };

      const mockCompilerResult: CompilerResult = {
        learningEntry: mockLearningEntry,
        priorDeltas: mockPriorDeltas,
        mappingDiagnostics: [],
      };

      // Mock manifest content
      const manifestContent = JSON.stringify({
        run_id: 'run-001',
        baselines: [
          {
            artifact_scope: 'forecast',
            artifact_path: 'docs/business-os/startup-baselines/BRIK/runs/run-001/baseline-forecast.md',
          },
        ],
      });

      mockFs.readFileSync.mockImplementation((path: any) => {
        if (path.includes('baseline.manifest.json')) {
          return manifestContent;
        }
        return '{}';
      });

      // Setup mocks
      (buildPriorIndex as jest.Mock).mockReturnValue(mockPriorIndex);
      (compileExperimentLearning as jest.Mock).mockReturnValue(mockCompilerResult);
      (appendLearningEntry as jest.Mock).mockReturnValue({ appended: true });
      (computeSnapshotPath as jest.Mock).mockReturnValue(
        'docs/business-os/startup-baselines/BRIK/runs/run-001/baseline-forecast.abc123de.snapshot.md'
      );
      (applyPriorDeltas as jest.Mock).mockReturnValue(
        'docs/business-os/startup-baselines/BRIK/runs/run-001/baseline-forecast.abc123de.snapshot.md'
      );

      const readout: S10LearningInput = {
        experiment_id: 'booking-flow-test',
        run_id: 'run-001',
        readout_path: 'docs/business-os/startup-baselines/BRIK/runs/run-001/stages/S10/readouts/booking-flow-test.md',
        verdict: 'PASS',
        confidence: 'HIGH',
      };

      const result = runLearningCompilation(readout, 'BRIK');

      // Verify result
      expect(result.status).toBe('success');
      expect(result.entry_id).toBe('abc123def456');
      expect(result.ledger_appended).toBe(true);
      expect(result.prior_deltas_path).toContain('prior-deltas-abc123de.json');
      expect(result.updated_baselines).toHaveLength(1);
      expect(result.manifest_updated).toBe(true);
      expect(result.compiler_diagnostics).toEqual([]);
      expect(result.warnings).toEqual([]);

      // Verify call sequence
      expect(buildPriorIndex).toHaveBeenCalledTimes(1);
      expect(compileExperimentLearning).toHaveBeenCalledTimes(1);
      expect(appendLearningEntry).toHaveBeenCalledTimes(1);
      expect(applyPriorDeltas).toHaveBeenCalledTimes(1);

      // Verify appendLearningEntry was called with created_at timestamp
      const appendCall = (appendLearningEntry as jest.Mock).mock.calls[0];
      expect(appendCall[0]).toBe('BRIK');
      expect(appendCall[1]).toHaveProperty('created_at');
      expect(appendCall[1].created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Verify prior-delta artifact was written
      const priorDeltasWriteCalls = mockFs.writeFileSync.mock.calls.filter((call: any) =>
        call[0].includes('prior-deltas-')
      );
      expect(priorDeltasWriteCalls).toHaveLength(1);

      // Verify stage-result was written
      const stageResultWriteCalls = mockFs.writeFileSync.mock.calls.filter((call: any) =>
        call[0].includes('stage-result.json')
      );
      expect(stageResultWriteCalls).toHaveLength(1);
      const stageResultContent = JSON.parse(stageResultWriteCalls[0][1] as string);
      expect(stageResultContent).toHaveProperty('learning_ledger');
      expect(stageResultContent).toHaveProperty('prior_deltas_path');
      expect(stageResultContent).toHaveProperty('updated_baselines');
      expect(stageResultContent).toHaveProperty('compiler_diagnostics');

      // Verify manifest was updated
      const manifestWriteCalls = mockFs.writeFileSync.mock.calls.filter((call: any) =>
        call[0].includes('baseline.manifest.json')
      );
      expect(manifestWriteCalls).toHaveLength(1);
      const updatedManifest = JSON.parse(manifestWriteCalls[0][1] as string);
      expect(updatedManifest).toHaveProperty('next_seed');
    });
  });

  describe('VC-LC-06-02: Malformed readout', () => {
    it('should return structured error for missing required fields', () => {
      const invalidReadout = {
        experiment_id: 'test',
        // Missing run_id, readout_path, verdict, confidence
      } as any;

      const result = runLearningCompilation(invalidReadout, 'BRIK');

      expect(result.status).toBe('error');
      expect(result.entry_id).toBeNull();
      expect(result.ledger_appended).toBe(false);
      expect(result.prior_deltas_path).toBeNull();
      expect(result.updated_baselines).toEqual([]);
      expect(result.manifest_updated).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('required');

      // Verify no files were written
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should return structured error for invalid verdict', () => {
      const invalidReadout: S10LearningInput = {
        experiment_id: 'test',
        run_id: 'run-001',
        readout_path: 'path/to/readout.md',
        verdict: 'INVALID' as any,
        confidence: 'HIGH',
      };

      const result = runLearningCompilation(invalidReadout, 'BRIK');

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('verdict');
    });
  });

  describe('VC-LC-06-03: Supersede flow', () => {
    it('should invert superseded deltas before applying new deltas', async () => {
      const { buildPriorIndex } = await import('../baseline-priors');
      const { compileExperimentLearning } = await import('../learning-compiler');
      const { appendLearningEntry, queryLearningEntries } = await import('../learning-ledger');
      const { applyPriorDeltas, computeSnapshotPath } = await import('../prior-update-writer');

      const mockPriorIndex: PriorIndex = {
        entries: [
          {
            prior_id: 'target.orders',
            artifact_scope: 'forecast',
            artifact_path: 'docs/business-os/startup-baselines/BRIK/runs/run-001/baseline-forecast.md',
            qualified_ref: 'forecast#target.orders',
          },
        ],
        by_id: new Map(),
      };

      // Superseded entry and its deltas
      const supersededEntry: LearningEntry = {
        schema_version: 1,
        entry_id: 'old123',
        run_id: 'run-001',
        experiment_id: 'old-experiment',
        readout_path: 'old-readout.md',
        readout_digest: 'olddigest',
        created_at: '2026-01-01T10:00:00Z',
        verdict: 'PASS',
        confidence: 'HIGH',
        affected_priors: ['target.orders'],
        prior_deltas_path: 'prior-deltas-old123.json',
      };

      const supersededDeltas: PriorDelta[] = [
        {
          prior_id: 'target.orders',
          artifact_path: 'docs/business-os/startup-baselines/BRIK/runs/run-001/baseline-forecast.md',
          old_confidence: 0.6,
          new_confidence: 0.8,
          delta: 0.2,
          reason: 'Old experiment',
          evidence_ref: 'old-readout.md',
          mapping_confidence: 'exact',
        },
      ];

      const newPriorDeltas: PriorDelta[] = [
        {
          prior_id: 'target.orders',
          artifact_path: 'docs/business-os/startup-baselines/BRIK/runs/run-001/baseline-forecast.md',
          old_confidence: 0.8,
          new_confidence: 0.7,
          delta: -0.1,
          reason: 'New experiment',
          evidence_ref: 'new-readout.md',
          mapping_confidence: 'exact',
        },
      ];

      const newLearningEntry: Omit<LearningEntry, 'created_at'> = {
        schema_version: 1,
        entry_id: 'new456',
        run_id: 'run-001',
        experiment_id: 'new-experiment',
        readout_path: 'new-readout.md',
        readout_digest: 'newdigest',
        verdict: 'FAIL',
        confidence: 'MEDIUM',
        affected_priors: ['target.orders'],
        prior_deltas_path: 'prior-deltas-new456.json',
        supersedes_entry_id: 'old123',
      };

      const manifestContent = JSON.stringify({
        run_id: 'run-001',
        baselines: [
          {
            artifact_scope: 'forecast',
            artifact_path: 'docs/business-os/startup-baselines/BRIK/runs/run-001/baseline-forecast.md',
          },
        ],
      });

      mockFs.readFileSync.mockImplementation((path: any) => {
        if (path.includes('baseline.manifest.json')) {
          return manifestContent;
        }
        if (path.includes('prior-deltas-old123.json')) {
          return JSON.stringify(supersededDeltas);
        }
        return '{}';
      });

      (buildPriorIndex as jest.Mock).mockReturnValue(mockPriorIndex);
      (compileExperimentLearning as jest.Mock).mockReturnValue({
        learningEntry: newLearningEntry,
        priorDeltas: newPriorDeltas,
        mappingDiagnostics: [],
      });
      (queryLearningEntries as jest.Mock).mockReturnValue([supersededEntry]);
      (appendLearningEntry as jest.Mock).mockReturnValue({ appended: true });
      (computeSnapshotPath as jest.Mock).mockReturnValue('snapshot.md');
      (applyPriorDeltas as jest.Mock).mockReturnValue('snapshot.md');

      const readout: S10LearningInput = {
        experiment_id: 'new-experiment',
        run_id: 'run-001',
        readout_path: 'new-readout.md',
        verdict: 'FAIL',
        confidence: 'MEDIUM',
        supersedes_entry_id: 'old123',
      };

      const result = runLearningCompilation(readout, 'BRIK');

      expect(result.status).toBe('success');

      // Verify applyPriorDeltas was called twice
      expect(applyPriorDeltas).toHaveBeenCalledTimes(2);

      // First call: apply inverted superseded deltas
      const firstCall = (applyPriorDeltas as jest.Mock).mock.calls[0];
      const invertedDeltas = firstCall[1] as PriorDelta[];
      expect(invertedDeltas).toHaveLength(1);
      expect(invertedDeltas[0].old_confidence).toBe(0.8); // Swapped
      expect(invertedDeltas[0].new_confidence).toBe(0.6); // Swapped
      expect(invertedDeltas[0].delta).toBe(-0.2); // Inverted

      // Second call: apply new deltas
      const secondCall = (applyPriorDeltas as jest.Mock).mock.calls[1];
      const appliedDeltas = secondCall[1] as PriorDelta[];
      expect(appliedDeltas).toEqual(newPriorDeltas);
    });
  });

  describe('VC-LC-06-04: Rerun idempotency', () => {
    it('should not create new snapshots when ledger returns appended: false', async () => {
      const { buildPriorIndex } = await import('../baseline-priors');
      const { compileExperimentLearning } = await import('../learning-compiler');
      const { appendLearningEntry } = await import('../learning-ledger');
      const { applyPriorDeltas } = await import('../prior-update-writer');

      const mockPriorIndex: PriorIndex = {
        entries: [],
        by_id: new Map(),
      };

      const mockLearningEntry: Omit<LearningEntry, 'created_at'> = {
        schema_version: 1,
        entry_id: 'duplicate123',
        run_id: 'run-001',
        experiment_id: 'test',
        readout_path: 'readout.md',
        readout_digest: 'samedigest',
        verdict: 'PASS',
        confidence: 'HIGH',
        affected_priors: [],
        prior_deltas_path: 'prior-deltas-duplicat.json',
      };

      const manifestContent = JSON.stringify({
        run_id: 'run-001',
        baselines: [],
      });

      mockFs.readFileSync.mockImplementation((path: any) => {
        if (path.includes('baseline.manifest.json')) {
          return manifestContent;
        }
        return '{}';
      });

      (buildPriorIndex as jest.Mock).mockReturnValue(mockPriorIndex);
      (compileExperimentLearning as jest.Mock).mockReturnValue({
        learningEntry: mockLearningEntry,
        priorDeltas: [],
        mappingDiagnostics: [],
      });
      (appendLearningEntry as jest.Mock).mockReturnValue({ appended: false });

      const readout: S10LearningInput = {
        experiment_id: 'test',
        run_id: 'run-001',
        readout_path: 'readout.md',
        verdict: 'PASS',
        confidence: 'HIGH',
      };

      const result = runLearningCompilation(readout, 'BRIK');

      expect(result.status).toBe('partial');
      expect(result.ledger_appended).toBe(false);
      expect(result.updated_baselines).toEqual([]);
      expect(result.manifest_updated).toBe(false);

      // Verify applyPriorDeltas was NOT called
      expect(applyPriorDeltas).not.toHaveBeenCalled();

      // Verify manifest was NOT updated
      const manifestWriteCalls = mockFs.writeFileSync.mock.calls.filter((call: any) =>
        call[0].includes('baseline.manifest.json')
      );
      expect(manifestWriteCalls).toHaveLength(0);
    });
  });

  describe('Additional validation tests', () => {
    it('should write prior-delta artifact as valid JSON', async () => {
      const { buildPriorIndex } = await import('../baseline-priors');
      const { compileExperimentLearning } = await import('../learning-compiler');
      const { appendLearningEntry } = await import('../learning-ledger');
      const { applyPriorDeltas, computeSnapshotPath } = await import('../prior-update-writer');

      const mockPriorDeltas: PriorDelta[] = [
        {
          prior_id: 'test.prior',
          artifact_path: 'test.md',
          old_confidence: 0.5,
          new_confidence: 0.7,
          delta: 0.2,
          reason: 'Test',
          evidence_ref: 'test-evidence.md',
          mapping_confidence: 'exact',
        },
      ];

      const manifestContent = JSON.stringify({
        run_id: 'run-001',
        baselines: [],
      });

      mockFs.readFileSync.mockImplementation((path: any) => {
        if (path.includes('baseline.manifest.json')) {
          return manifestContent;
        }
        return '{}';
      });

      (buildPriorIndex as jest.Mock).mockReturnValue({ entries: [], by_id: new Map() });
      (compileExperimentLearning as jest.Mock).mockReturnValue({
        learningEntry: {
          schema_version: 1,
          entry_id: 'test123',
          run_id: 'run-001',
          experiment_id: 'test',
          readout_path: 'readout.md',
          readout_digest: 'digest',
          verdict: 'PASS',
          confidence: 'HIGH',
          affected_priors: ['test.prior'],
          prior_deltas_path: 'prior-deltas-test123.json',
        },
        priorDeltas: mockPriorDeltas,
        mappingDiagnostics: [],
      });
      (appendLearningEntry as jest.Mock).mockReturnValue({ appended: true });
      (computeSnapshotPath as jest.Mock).mockReturnValue('snapshot.md');
      (applyPriorDeltas as jest.Mock).mockReturnValue('snapshot.md');

      const readout: S10LearningInput = {
        experiment_id: 'test',
        run_id: 'run-001',
        readout_path: 'readout.md',
        verdict: 'PASS',
        confidence: 'HIGH',
      };

      runLearningCompilation(readout, 'BRIK');

      // Find the prior-deltas write call
      const priorDeltasWriteCalls = mockFs.writeFileSync.mock.calls.filter((call: any) =>
        call[0].includes('prior-deltas-')
      );
      expect(priorDeltasWriteCalls).toHaveLength(1);

      // Verify it's valid JSON
      const writtenContent = priorDeltasWriteCalls[0][1] as string;
      expect(() => JSON.parse(writtenContent)).not.toThrow();
      const parsed = JSON.parse(writtenContent);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toEqual(mockPriorDeltas);
    });

    it('should handle INCONCLUSIVE verdict with no snapshots written', async () => {
      const { buildPriorIndex } = await import('../baseline-priors');
      const { compileExperimentLearning } = await import('../learning-compiler');
      const { appendLearningEntry } = await import('../learning-ledger');
      const { applyPriorDeltas } = await import('../prior-update-writer');

      const manifestContent = JSON.stringify({
        run_id: 'run-001',
        baselines: [],
      });

      mockFs.readFileSync.mockImplementation((path: any) => {
        if (path.includes('baseline.manifest.json')) {
          return manifestContent;
        }
        return '{}';
      });

      (buildPriorIndex as jest.Mock).mockReturnValue({ entries: [], by_id: new Map() });
      (compileExperimentLearning as jest.Mock).mockReturnValue({
        learningEntry: {
          schema_version: 1,
          entry_id: 'inconclusive123',
          run_id: 'run-001',
          experiment_id: 'test',
          readout_path: 'readout.md',
          readout_digest: 'digest',
          verdict: 'INCONCLUSIVE',
          confidence: 'LOW',
          affected_priors: [],
          prior_deltas_path: 'prior-deltas-inconclu.json',
        },
        priorDeltas: [], // Empty deltas for INCONCLUSIVE
        mappingDiagnostics: [],
      });
      (appendLearningEntry as jest.Mock).mockReturnValue({ appended: true });

      const readout: S10LearningInput = {
        experiment_id: 'test',
        run_id: 'run-001',
        readout_path: 'readout.md',
        verdict: 'INCONCLUSIVE',
        confidence: 'LOW',
      };

      const result = runLearningCompilation(readout, 'BRIK');

      expect(result.status).toBe('success');
      expect(result.ledger_appended).toBe(true);
      expect(result.updated_baselines).toEqual([]);
      expect(result.manifest_updated).toBe(false);

      // Verify applyPriorDeltas was NOT called
      expect(applyPriorDeltas).not.toHaveBeenCalled();
    });

    it('should continue with ledger append even if snapshot write fails', async () => {
      const { buildPriorIndex } = await import('../baseline-priors');
      const { compileExperimentLearning } = await import('../learning-compiler');
      const { appendLearningEntry } = await import('../learning-ledger');
      const { applyPriorDeltas, computeSnapshotPath } = await import('../prior-update-writer');

      const manifestContent = JSON.stringify({
        run_id: 'run-001',
        baselines: [
          {
            artifact_scope: 'forecast',
            artifact_path: 'baseline-forecast.md',
          },
        ],
      });

      mockFs.readFileSync.mockImplementation((path: any) => {
        if (path.includes('baseline.manifest.json')) {
          return manifestContent;
        }
        return '{}';
      });

      (buildPriorIndex as jest.Mock).mockReturnValue({ entries: [], by_id: new Map() });
      (compileExperimentLearning as jest.Mock).mockReturnValue({
        learningEntry: {
          schema_version: 1,
          entry_id: 'test123',
          run_id: 'run-001',
          experiment_id: 'test',
          readout_path: 'readout.md',
          readout_digest: 'digest',
          verdict: 'PASS',
          confidence: 'HIGH',
          affected_priors: ['test.prior'],
          prior_deltas_path: 'prior-deltas-test123.json',
        },
        priorDeltas: [
          {
            prior_id: 'test.prior',
            artifact_path: 'baseline-forecast.md',
            old_confidence: 0.5,
            new_confidence: 0.7,
            delta: 0.2,
            reason: 'Test',
            evidence_ref: 'test.md',
            mapping_confidence: 'exact',
          },
        ],
        mappingDiagnostics: [],
      });
      (appendLearningEntry as jest.Mock).mockReturnValue({ appended: true });
      (computeSnapshotPath as jest.Mock).mockReturnValue('snapshot.md');
      (applyPriorDeltas as jest.Mock).mockImplementation(() => {
        throw new Error('Snapshot write failed');
      });

      const readout: S10LearningInput = {
        experiment_id: 'test',
        run_id: 'run-001',
        readout_path: 'readout.md',
        verdict: 'PASS',
        confidence: 'HIGH',
      };

      const result = runLearningCompilation(readout, 'BRIK');

      expect(result.status).toBe('partial');
      expect(result.ledger_appended).toBe(true);
      expect(result.updated_baselines).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Snapshot write failed');
    });
  });
});
