/**
 * Tests for learning-compiler.ts
 * Task: LC-04 from docs/plans/learning-compiler-plan.md
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { buildPriorIndex,type ManifestPointer, type PriorIndex } from '../baseline-priors';
import {
  compileExperimentLearning,
  CompilerResult,
  type ExperimentReadout,
  PriorDelta,
} from '../learning-compiler';

describe('learning-compiler', () => {
  let tempDir: string;
  let testPriorIndex: PriorIndex;

  beforeEach(() => {
    // Create temporary directory for test artifacts
    tempDir = fs.mkdtempSync(path.join('/tmp', 'learning-compiler-test-'));

    // Create test baseline artifacts
    const forecastArtifact = `# Forecast Baseline

## Priors (Machine)

Last updated: 2026-01-01 12:00 UTC

\`\`\`json
[
  {
    "id": "target.orders",
    "type": "target",
    "statement": "Target monthly order volume",
    "confidence": 0.6,
    "value": 100,
    "unit": "orders/month",
    "operator": "gte",
    "range": null,
    "last_updated": "2026-01-01T12:00:00Z",
    "evidence": ["initial-estimate.md"]
  },
  {
    "id": "assumption.conversion",
    "type": "assumption",
    "statement": "Assumed conversion rate for online bookings",
    "confidence": 0.8,
    "value": 0.05,
    "unit": "ratio",
    "operator": "eq",
    "range": null,
    "last_updated": "2026-01-01T12:00:00Z",
    "evidence": ["market-research.md"]
  }
]
\`\`\`
`;

    const offerArtifact = `# Offer Baseline

## Priors (Machine)

Last updated: 2026-01-01 12:00 UTC

\`\`\`json
[
  {
    "id": "constraint.price",
    "type": "constraint",
    "statement": "Maximum price constraint for base package",
    "confidence": 0.7,
    "value": 150,
    "unit": "EUR",
    "operator": "lte",
    "range": null,
    "last_updated": "2026-01-01T12:00:00Z",
    "evidence": ["competitor-analysis.md"]
  }
]
\`\`\`
`;

    // Write test artifacts
    const forecastPath = path.join(tempDir, 'forecast-baseline.md');
    const offerPath = path.join(tempDir, 'offer-baseline.md');
    fs.writeFileSync(forecastPath, forecastArtifact);
    fs.writeFileSync(offerPath, offerArtifact);

    // Build prior index
    const pointers: ManifestPointer[] = [
      {
        artifact_scope: 'forecast',
        artifact_path: forecastPath,
      },
      {
        artifact_scope: 'offer',
        artifact_path: offerPath,
      },
    ];
    testPriorIndex = buildPriorIndex(pointers);
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('compileExperimentLearning', () => {
    describe('VC-LC-04-01: Delta computation for PASS verdicts', () => {
      it('should compute delta +0.2 for PASS/HIGH', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-001',
          run_id: 'run-001',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        const delta = result.priorDeltas[0];
        expect(delta.prior_id).toBe('target.orders');
        expect(delta.old_confidence).toBe(0.6);
        expect(delta.delta).toBeCloseTo(0.2, 10);
        expect(delta.new_confidence).toBeCloseTo(0.8, 10);
        expect(delta.mapping_confidence).toBe('exact');
      });

      it('should compute delta +0.1 for PASS/MEDIUM', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-002',
          run_id: 'run-002',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'MEDIUM',
          prior_refs: ['forecast#target.orders'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        const delta = result.priorDeltas[0];
        expect(delta.delta).toBeCloseTo(0.1, 10);
        expect(delta.new_confidence).toBeCloseTo(0.7, 10);
      });

      it('should compute delta +0.05 for PASS/LOW', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-003',
          run_id: 'run-003',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'LOW',
          prior_refs: ['forecast#target.orders'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        const delta = result.priorDeltas[0];
        expect(delta.delta).toBeCloseTo(0.05, 10);
        expect(delta.new_confidence).toBeCloseTo(0.65, 10);
      });
    });

    describe('VC-LC-04-02: Delta computation for FAIL verdicts', () => {
      it('should compute delta -0.3 for FAIL/HIGH', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-004',
          run_id: 'run-004',
          readout_path: '/test/readout.md',
          verdict: 'FAIL',
          confidence: 'HIGH',
          prior_refs: ['forecast#assumption.conversion'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        const delta = result.priorDeltas[0];
        expect(delta.prior_id).toBe('assumption.conversion');
        expect(delta.old_confidence).toBe(0.8);
        expect(delta.delta).toBeCloseTo(-0.3, 10);
        expect(delta.new_confidence).toBeCloseTo(0.5, 10);
      });

      it('should compute delta -0.075 for FAIL/LOW', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-005',
          run_id: 'run-005',
          readout_path: '/test/readout.md',
          verdict: 'FAIL',
          confidence: 'LOW',
          prior_refs: ['forecast#assumption.conversion'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        const delta = result.priorDeltas[0];
        expect(delta.delta).toBeCloseTo(-0.075, 10);
        expect(delta.new_confidence).toBeCloseTo(0.725, 10);
      });

      it('should clamp confidence to 0.0 minimum', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-006',
          run_id: 'run-006',
          readout_path: '/test/readout.md',
          verdict: 'FAIL',
          confidence: 'HIGH',
          prior_refs: ['offer#constraint.price'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        const delta = result.priorDeltas[0];
        expect(delta.old_confidence).toBe(0.7);
        expect(delta.delta).toBeCloseTo(-0.3, 10);
        expect(delta.new_confidence).toBeCloseTo(0.4, 10);
      });

      it('should clamp confidence to 1.0 maximum', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-007',
          run_id: 'run-007',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#assumption.conversion'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        const delta = result.priorDeltas[0];
        expect(delta.old_confidence).toBe(0.8);
        expect(delta.new_confidence).toBeLessThanOrEqual(1.0);
      });
    });

    describe('VC-LC-04-03: Prior-ref routing with explicit references', () => {
      it('should use exact mapping when prior_refs is present', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-008',
          run_id: 'run-008',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders', 'offer#constraint.price'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(2);
        expect(result.priorDeltas[0].mapping_confidence).toBe('exact');
        expect(result.priorDeltas[1].mapping_confidence).toBe('exact');
        expect(result.mappingDiagnostics).toHaveLength(0);
      });

      it('should resolve artifact_path#prior_id format', () => {
        const forecastPath = testPriorIndex.entries.find(
          e => e.artifact_scope === 'forecast'
        )!.artifact_path;

        const readout: ExperimentReadout = {
          experiment_id: 'exp-009',
          run_id: 'run-009',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: [`${forecastPath}#target.orders`],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        expect(result.priorDeltas[0].prior_id).toBe('target.orders');
        expect(result.priorDeltas[0].mapping_confidence).toBe('exact');
      });

      it('should resolve bare prior_id when unambiguous', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-010',
          run_id: 'run-010',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['target.orders'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        expect(result.priorDeltas[0].prior_id).toBe('target.orders');
        expect(result.priorDeltas[0].mapping_confidence).toBe('exact');
      });

      it('should emit warning for prior_ref not found', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-011',
          run_id: 'run-011',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#nonexistent.prior'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(0);
        expect(result.mappingDiagnostics.length).toBeGreaterThan(0);
        expect(result.mappingDiagnostics[0]).toContain(
          'Prior ref not found: forecast#nonexistent.prior'
        );
      });

      it('should not invoke keyword matcher when prior_refs is present', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-conversion-rate-test', // contains "conversion" keyword
          run_id: 'run-012',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'], // explicit ref, not keyword-matched
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        expect(result.priorDeltas[0].prior_id).toBe('target.orders');
        expect(result.priorDeltas[0].mapping_confidence).toBe('exact');
        // Should NOT match assumption.conversion despite keyword
      });
    });

    describe('VC-LC-04-04: Keyword fallback mapping', () => {
      it('should use keyword matching when prior_refs is absent', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-assumption-conversion-rate',
          run_id: 'run-013',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas.length).toBeGreaterThan(0);
        expect(result.priorDeltas[0].mapping_confidence).toBe('keyword');
      });

      it('should emit ambiguity warning when multiple priors match', () => {
        // Create ambiguous scenario by modifying prior statements
        const multiMatchArtifact = `# Multi Match Baseline

## Priors (Machine)

Last updated: 2026-01-01 12:00 UTC

\`\`\`json
[
  {
    "id": "prior.test.one",
    "type": "assumption",
    "statement": "Test prior number one",
    "confidence": 0.6,
    "value": null,
    "unit": null,
    "operator": null,
    "range": null,
    "last_updated": "2026-01-01T12:00:00Z",
    "evidence": []
  },
  {
    "id": "prior.test.two",
    "type": "assumption",
    "statement": "Test prior number two",
    "confidence": 0.7,
    "value": null,
    "unit": null,
    "operator": null,
    "range": null,
    "last_updated": "2026-01-01T12:00:00Z",
    "evidence": []
  }
]
\`\`\`
`;
        const multiMatchPath = path.join(tempDir, 'multi-match.md');
        fs.writeFileSync(multiMatchPath, multiMatchArtifact);

        const extendedIndex = buildPriorIndex([
          ...testPriorIndex.entries.map(e => ({
            artifact_scope: e.artifact_scope,
            artifact_path: e.artifact_path,
          })),
          {
            artifact_scope: 'multi',
            artifact_path: multiMatchPath,
          },
        ]);

        const readout: ExperimentReadout = {
          experiment_id: 'exp-test-prior',
          run_id: 'run-014',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
        };

        const result = compileExperimentLearning(readout, extendedIndex);

        const ambiguousDeltas = result.priorDeltas.filter(
          d => d.mapping_confidence === 'ambiguous'
        );
        expect(ambiguousDeltas.length).toBeGreaterThan(0);
        expect(
          result.mappingDiagnostics.some(d => d.includes('Ambiguous keyword match'))
        ).toBe(true);
      });

      it('should return empty deltas when no keyword matches', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-no-match-xyz123',
          run_id: 'run-015',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(0);
        expect(
          result.mappingDiagnostics.some(d => d.includes('No matching priors found'))
        ).toBe(true);
      });
    });

    describe('VC-LC-04-05: Digest normalization and entry_id generation', () => {
      it('should produce stable digest for same semantic content', () => {
        const readout1: ExperimentReadout = {
          experiment_id: 'exp-016',
          run_id: 'run-016',
          readout_path: '/path/one/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
          metrics: { accuracy: 0.95 },
        };

        const readout2: ExperimentReadout = {
          experiment_id: 'exp-016',
          run_id: 'run-016',
          readout_path: '/path/two/different.md', // different path
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
          metrics: { accuracy: 0.95 },
        };

        const result1 = compileExperimentLearning(readout1, testPriorIndex);
        const result2 = compileExperimentLearning(readout2, testPriorIndex);

        expect(result1.learningEntry.readout_digest).toBe(
          result2.learningEntry.readout_digest
        );
      });

      it('should produce different digest when semantic content changes', () => {
        const readout1: ExperimentReadout = {
          experiment_id: 'exp-017',
          run_id: 'run-017',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
        };

        const readout2: ExperimentReadout = {
          experiment_id: 'exp-017',
          run_id: 'run-017',
          readout_path: '/test/readout.md',
          verdict: 'FAIL', // different verdict
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
        };

        const result1 = compileExperimentLearning(readout1, testPriorIndex);
        const result2 = compileExperimentLearning(readout2, testPriorIndex);

        expect(result1.learningEntry.readout_digest).not.toBe(
          result2.learningEntry.readout_digest
        );
      });

      it('should generate entry_id from run_id + experiment_id + digest', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-018',
          run_id: 'run-018',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.learningEntry.entry_id).toBeTruthy();
        expect(result.learningEntry.entry_id).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
      });

      it('should produce stable entry_id for identical inputs', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-019',
          run_id: 'run-019',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
        };

        const result1 = compileExperimentLearning(readout, testPriorIndex);
        const result2 = compileExperimentLearning(readout, testPriorIndex);

        expect(result1.learningEntry.entry_id).toBe(
          result2.learningEntry.entry_id
        );
      });
    });

    describe('INCONCLUSIVE verdict handling', () => {
      it('should produce zero delta for INCONCLUSIVE verdict', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-020',
          run_id: 'run-020',
          readout_path: '/test/readout.md',
          verdict: 'INCONCLUSIVE',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        const delta = result.priorDeltas[0];
        expect(delta.delta).toBe(0);
        expect(delta.new_confidence).toBe(delta.old_confidence);
      });
    });

    describe('LearningEntry generation', () => {
      it('should generate complete learning entry structure', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-021',
          run_id: 'run-021',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders', 'offer#constraint.price'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.learningEntry).toMatchObject({
          schema_version: 1,
          entry_id: expect.any(String),
          run_id: 'run-021',
          experiment_id: 'exp-021',
          readout_path: '/test/readout.md',
          readout_digest: expect.any(String),
          verdict: 'PASS',
          confidence: 'HIGH',
          affected_priors: expect.arrayContaining([
            'target.orders',
            'constraint.price',
          ]),
          prior_deltas_path: expect.stringContaining('prior-deltas-'),
        });

        expect(result.learningEntry.supersedes_entry_id).toBeUndefined();
      });

      it('should generate prior_deltas_path with entry_id', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-022',
          run_id: 'run-022',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        const entryId = result.learningEntry.entry_id.substring(0, 8);
        expect(result.learningEntry.prior_deltas_path).toContain(entryId);
        expect(result.learningEntry.prior_deltas_path).toMatch(
          /prior-deltas-[a-f0-9]{8}\.json$/
        );
      });
    });

    describe('PriorDelta structure validation', () => {
      it('should include all required PriorDelta fields', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-023',
          run_id: 'run-023',
          readout_path: '/test/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas).toHaveLength(1);
        const delta = result.priorDeltas[0];

        expect(delta).toMatchObject({
          prior_id: 'target.orders',
          artifact_path: expect.any(String),
          old_confidence: expect.any(Number),
          new_confidence: expect.any(Number),
          delta: expect.any(Number),
          reason: expect.any(String),
          evidence_ref: expect.any(String),
          mapping_confidence: 'exact',
        });
      });

      it('should include readout_path as evidence_ref', () => {
        const readout: ExperimentReadout = {
          experiment_id: 'exp-024',
          run_id: 'run-024',
          readout_path: '/test/specific/readout.md',
          verdict: 'PASS',
          confidence: 'HIGH',
          prior_refs: ['forecast#target.orders'],
        };

        const result = compileExperimentLearning(readout, testPriorIndex);

        expect(result.priorDeltas[0].evidence_ref).toBe(
          '/test/specific/readout.md'
        );
      });
    });
  });
});
