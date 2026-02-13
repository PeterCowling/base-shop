/**
 * Baseline Priors Extraction Test
 *
 * Tests extraction, validation, and round-trip serialization of machine priors blocks
 * from baseline artifacts.
 *
 * Task: LC-00 from docs/plans/learning-compiler-plan.md
 */

import type { Prior } from '../baseline-priors';
import { extractPriors, replaceMachineBlock, serializePriors } from '../baseline-priors';

// Fixture: Sample baseline doc with Priors (Machine) block
const FIXTURE_BASELINE_DOC = `---
Type: Startup-Baseline-Seed
Status: Draft
Business: TEST
Created: 2026-02-13
---

# TEST Forecast Seed

## Business Context

This is human-editable narrative content that should be preserved.

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

\`\`\`json
[
  {
    "id": "forecast.target.orders",
    "type": "target",
    "statement": "Orders target for 90 days is 100",
    "confidence": 0.6,
    "value": 100,
    "unit": "orders",
    "last_updated": "2026-02-13T12:00:00Z",
    "evidence": ["Initial market sizing"]
  },
  {
    "id": "forecast.constraint.cac",
    "type": "constraint",
    "statement": "CAC must be <=EUR 15",
    "confidence": 0.7,
    "value": 15,
    "unit": "EUR",
    "operator": "lte",
    "last_updated": "2026-02-13T12:00:00Z",
    "evidence": ["Contribution analysis"]
  },
  {
    "id": "icp.primary.segment",
    "type": "assumption",
    "statement": "Primary ICP is urban professionals",
    "confidence": 0.75,
    "last_updated": "2026-02-13T12:00:00Z",
    "evidence": ["Market research"]
  }
]
\`\`\`

## Other Context

More narrative content below the machine block.
`;

describe('baseline-priors-extraction', () => {
  describe('extractPriors', () => {
    it('should extract priors from valid machine block', () => {
      const priors = extractPriors(FIXTURE_BASELINE_DOC);

      expect(priors).toHaveLength(3);
      expect(priors[0].id).toBe('forecast.target.orders');
      expect(priors[1].id).toBe('forecast.constraint.cac');
      expect(priors[2].id).toBe('icp.primary.segment');
    });

    it('should validate required fields', () => {
      const priors = extractPriors(FIXTURE_BASELINE_DOC);

      priors.forEach(prior => {
        expect(prior).toHaveProperty('id');
        expect(prior).toHaveProperty('type');
        expect(prior).toHaveProperty('statement');
        expect(prior).toHaveProperty('confidence');
        expect(prior).toHaveProperty('last_updated');
        expect(prior).toHaveProperty('evidence');

        expect(typeof prior.id).toBe('string');
        expect(['assumption', 'constraint', 'target', 'preference', 'risk']).toContain(prior.type);
        expect(typeof prior.statement).toBe('string');
        expect(typeof prior.confidence).toBe('number');
        expect(prior.confidence).toBeGreaterThanOrEqual(0);
        expect(prior.confidence).toBeLessThanOrEqual(1);
        expect(typeof prior.last_updated).toBe('string');
        expect(Array.isArray(prior.evidence)).toBe(true);
        expect(prior.evidence.length).toBeGreaterThan(0);
      });
    });

    it('should extract typed fields when present', () => {
      const priors = extractPriors(FIXTURE_BASELINE_DOC);

      const targetPrior = priors.find(p => p.id === 'forecast.target.orders');
      expect(targetPrior).toBeDefined();
      expect(targetPrior!.value).toBe(100);
      expect(targetPrior!.unit).toBe('orders');

      const constraintPrior = priors.find(p => p.id === 'forecast.constraint.cac');
      expect(constraintPrior).toBeDefined();
      expect(constraintPrior!.value).toBe(15);
      expect(constraintPrior!.unit).toBe('EUR');
      expect(constraintPrior!.operator).toBe('lte');

      const assumptionPrior = priors.find(p => p.id === 'icp.primary.segment');
      expect(assumptionPrior).toBeDefined();
      expect(assumptionPrior!.value).toBeUndefined();
    });

    it('should throw on missing machine block', () => {
      const invalidDoc = `# Some Doc\n\nNo machine block here.`;

      expect(() => extractPriors(invalidDoc)).toThrow('No Priors (Machine) block found');
    });

    it('should throw on empty machine block', () => {
      const emptyBlockDoc = `## Priors (Machine)\n\n\`\`\`json\n\`\`\``;

      expect(() => extractPriors(emptyBlockDoc)).toThrow('Priors (Machine) block is empty');
    });

    it('should throw on invalid JSON', () => {
      const invalidJsonDoc = `## Priors (Machine)\n\n\`\`\`json\n{invalid json}\n\`\`\``;

      expect(() => extractPriors(invalidJsonDoc)).toThrow('Failed to parse priors JSON');
    });
  });

  describe('serializePriors', () => {
    it('should serialize priors to machine block format', () => {
      const priors: Prior[] = [
        {
          id: 'test.prior',
          type: 'target',
          statement: 'Test statement',
          confidence: 0.8,
          last_updated: '2026-02-13T12:00:00Z',
          evidence: ['Test evidence']
        }
      ];

      const serialized = serializePriors(priors, '2026-02-13 12:00 UTC');

      expect(serialized).toContain('## Priors (Machine)');
      expect(serialized).toContain('Last updated: 2026-02-13 12:00 UTC');
      expect(serialized).toContain('```json');
      expect(serialized).toContain('"id": "test.prior"');
      expect(serialized).toContain('"confidence": 0.8');
    });

    it('should use current date if timestamp not provided', () => {
      const priors: Prior[] = [
        {
          id: 'test.prior',
          type: 'target',
          statement: 'Test statement',
          confidence: 0.8,
          last_updated: '2026-02-13T12:00:00Z',
          evidence: ['Test evidence']
        }
      ];

      const serialized = serializePriors(priors);

      expect(serialized).toContain('Last updated:');
      expect(serialized).toMatch(/Last updated: \d{4}-\d{2}-\d{2} 12:00 UTC/);
    });
  });

  describe('round-trip', () => {
    it('should preserve priors through extract -> serialize -> extract cycle', () => {
      // Extract from fixture
      const originalPriors = extractPriors(FIXTURE_BASELINE_DOC);

      // Serialize back to machine block
      const serialized = serializePriors(originalPriors, '2026-02-13 12:00 UTC');

      // Replace in original doc
      const updatedDoc = replaceMachineBlock(FIXTURE_BASELINE_DOC, serialized);

      // Extract again
      const roundTripPriors = extractPriors(updatedDoc);

      // Verify identical
      expect(roundTripPriors).toHaveLength(originalPriors.length);
      expect(roundTripPriors).toEqual(originalPriors);
    });

    it('should preserve narrative content outside machine block', () => {
      const originalPriors = extractPriors(FIXTURE_BASELINE_DOC);
      const serialized = serializePriors(originalPriors, '2026-02-13 12:00 UTC');
      const updatedDoc = replaceMachineBlock(FIXTURE_BASELINE_DOC, serialized);

      // Check narrative sections are unchanged
      expect(updatedDoc).toContain('## Business Context');
      expect(updatedDoc).toContain('This is human-editable narrative content');
      expect(updatedDoc).toContain('## Other Context');
      expect(updatedDoc).toContain('More narrative content below the machine block');
    });

    it('should update only machine block and preserve frontmatter', () => {
      const originalPriors = extractPriors(FIXTURE_BASELINE_DOC);

      // Modify a prior
      const modifiedPriors = [...originalPriors];
      modifiedPriors[0] = { ...modifiedPriors[0], confidence: 0.9 };

      const serialized = serializePriors(modifiedPriors, '2026-02-13 14:00 UTC');
      const updatedDoc = replaceMachineBlock(FIXTURE_BASELINE_DOC, serialized);

      // Verify frontmatter preserved
      expect(updatedDoc).toContain('---');
      expect(updatedDoc).toContain('Type: Startup-Baseline-Seed');
      expect(updatedDoc).toContain('Business: TEST');

      // Verify prior was updated
      const finalPriors = extractPriors(updatedDoc);
      expect(finalPriors[0].confidence).toBe(0.9);

      // Verify timestamp was updated
      expect(updatedDoc).toContain('Last updated: 2026-02-13 14:00 UTC');
    });
  });

  describe('validation rules', () => {
    it('should validate confidence range [0.0, 1.0]', () => {
      const priors = extractPriors(FIXTURE_BASELINE_DOC);

      priors.forEach(prior => {
        expect(prior.confidence).toBeGreaterThanOrEqual(0.0);
        expect(prior.confidence).toBeLessThanOrEqual(1.0);
      });
    });

    it('should validate type enum', () => {
      const priors = extractPriors(FIXTURE_BASELINE_DOC);
      const validTypes = ['assumption', 'constraint', 'target', 'preference', 'risk'];

      priors.forEach(prior => {
        expect(validTypes).toContain(prior.type);
      });
    });

    it('should validate value/unit pairing', () => {
      const priors = extractPriors(FIXTURE_BASELINE_DOC);

      priors.forEach(prior => {
        if (prior.value !== undefined && prior.value !== null) {
          expect(prior.unit).toBeDefined();
          expect(prior.unit).not.toBeNull();
        }
      });
    });

    it('should validate operator requires value', () => {
      const priors = extractPriors(FIXTURE_BASELINE_DOC);

      priors.forEach(prior => {
        if (prior.operator) {
          expect(prior.value).toBeDefined();
          expect(prior.value).not.toBeNull();
        }
      });
    });

    it('should validate evidence is non-empty array', () => {
      const priors = extractPriors(FIXTURE_BASELINE_DOC);

      priors.forEach(prior => {
        expect(Array.isArray(prior.evidence)).toBe(true);
        expect(prior.evidence.length).toBeGreaterThan(0);
      });
    });
  });
});
