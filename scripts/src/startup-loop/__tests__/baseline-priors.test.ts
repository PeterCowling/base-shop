/**
 * Baseline Priors Module Test
 *
 * Tests for the canonical priors extraction/indexing/serialization module.
 * Focus: buildPriorIndex, duplicate detection, qualified refs, narrative isolation.
 *
 * Task: LC-03 from docs/plans/archive/learning-compiler-plan.md
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { ManifestPointer, PriorIndex } from '../baseline-priors';
import {
  buildPriorIndex,
  extractPriors,
  replaceMachineBlock,
  serializePriors,
  validateNoDuplicateBareIds,
} from '../baseline-priors';

// Test fixture: forecast artifact
const FIXTURE_FORECAST_ARTIFACT = `---
Type: Startup-Baseline-Seed
Status: Draft
Business: ACME
Artifact-Scope: forecast
Created: 2026-02-13
---

# ACME Forecast Seed

## Business Context

Forecast narrative content.

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

\`\`\`json
[
  {
    "id": "target.orders",
    "type": "target",
    "statement": "Orders target for 90 days is 100",
    "confidence": 0.6,
    "value": 100,
    "unit": "orders",
    "last_updated": "2026-02-13T12:00:00Z",
    "evidence": ["Market sizing"]
  },
  {
    "id": "constraint.cac",
    "type": "constraint",
    "statement": "CAC must be <=EUR 15",
    "confidence": 0.7,
    "value": 15,
    "unit": "EUR",
    "operator": "lte",
    "last_updated": "2026-02-13T12:00:00Z",
    "evidence": ["Contribution analysis"]
  }
]
\`\`\`

## Other Context

More narrative.
`;

// Test fixture: offer artifact
const FIXTURE_OFFER_ARTIFACT = `---
Type: Startup-Baseline-Seed
Status: Draft
Business: ACME
Artifact-Scope: offer
Created: 2026-02-13
---

# ACME Offer Seed

## Offer Context

Offer narrative content.

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

\`\`\`json
[
  {
    "id": "price.base",
    "type": "target",
    "statement": "Base price is EUR 49",
    "confidence": 0.8,
    "value": 49,
    "unit": "EUR",
    "last_updated": "2026-02-13T12:00:00Z",
    "evidence": ["Pricing analysis"]
  },
  {
    "id": "margin.minimum",
    "type": "constraint",
    "statement": "Minimum margin is 40%",
    "confidence": 0.75,
    "value": 40,
    "unit": "percent",
    "operator": "gte",
    "last_updated": "2026-02-13T12:00:00Z",
    "evidence": ["Cost analysis"]
  }
]
\`\`\`

## Pricing Strategy

More narrative.
`;

// Test fixture: channels artifact with DUPLICATE bare prior_id
const FIXTURE_CHANNELS_ARTIFACT_DUPLICATE = `---
Type: Startup-Baseline-Seed
Status: Draft
Business: ACME
Artifact-Scope: channels
Created: 2026-02-13
---

# ACME Channels Seed

## Channels Context

Channels narrative content.

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

\`\`\`json
[
  {
    "id": "target.orders",
    "type": "target",
    "statement": "Channel-specific orders target is 50",
    "confidence": 0.65,
    "value": 50,
    "unit": "orders",
    "last_updated": "2026-02-13T12:00:00Z",
    "evidence": ["Channel analysis"]
  }
]
\`\`\`

## Distribution

More narrative.
`;

describe('baseline-priors', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create temp directory for test fixtures
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-priors-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('buildPriorIndex', () => {
    it('should build index from single artifact', () => {
      // Arrange: write fixture
      const forecastPath = path.join(tempDir, 'forecast.md');
      fs.writeFileSync(forecastPath, FIXTURE_FORECAST_ARTIFACT);

      const pointers: ManifestPointer[] = [
        { artifact_scope: 'forecast', artifact_path: forecastPath },
      ];

      // Act
      const index = buildPriorIndex(pointers, tempDir);

      // Assert
      expect(index.entries).toHaveLength(2);
      expect(index.entries[0].prior_id).toBe('target.orders');
      expect(index.entries[0].artifact_scope).toBe('forecast');
      expect(index.entries[0].artifact_path).toBe(forecastPath);
      expect(index.entries[0].qualified_ref).toBe('forecast#target.orders');

      expect(index.entries[1].prior_id).toBe('constraint.cac');
      expect(index.entries[1].artifact_scope).toBe('forecast');
      expect(index.entries[1].qualified_ref).toBe('forecast#constraint.cac');

      // Check by_id map
      expect(index.by_id.size).toBe(2);
      expect(index.by_id.get('target.orders')).toHaveLength(1);
      expect(index.by_id.get('constraint.cac')).toHaveLength(1);
    });

    it('should build index from multiple artifacts', () => {
      // Arrange: write fixtures
      const forecastPath = path.join(tempDir, 'forecast.md');
      const offerPath = path.join(tempDir, 'offer.md');
      fs.writeFileSync(forecastPath, FIXTURE_FORECAST_ARTIFACT);
      fs.writeFileSync(offerPath, FIXTURE_OFFER_ARTIFACT);

      const pointers: ManifestPointer[] = [
        { artifact_scope: 'forecast', artifact_path: forecastPath },
        { artifact_scope: 'offer', artifact_path: offerPath },
      ];

      // Act
      const index = buildPriorIndex(pointers, tempDir);

      // Assert
      expect(index.entries).toHaveLength(4);

      // Verify all priors are indexed
      const priorIds = index.entries.map(e => e.prior_id);
      expect(priorIds).toContain('target.orders');
      expect(priorIds).toContain('constraint.cac');
      expect(priorIds).toContain('price.base');
      expect(priorIds).toContain('margin.minimum');

      // Check by_id map
      expect(index.by_id.size).toBe(4);
      expect(index.by_id.get('price.base')).toHaveLength(1);
      expect(index.by_id.get('price.base')![0].artifact_scope).toBe('offer');
    });

    it('should group duplicate bare prior_ids in by_id map', () => {
      // Arrange: write fixtures with duplicate prior_id
      const forecastPath = path.join(tempDir, 'forecast.md');
      const channelsPath = path.join(tempDir, 'channels.md');
      fs.writeFileSync(forecastPath, FIXTURE_FORECAST_ARTIFACT);
      fs.writeFileSync(channelsPath, FIXTURE_CHANNELS_ARTIFACT_DUPLICATE);

      const pointers: ManifestPointer[] = [
        { artifact_scope: 'forecast', artifact_path: forecastPath },
        { artifact_scope: 'channels', artifact_path: channelsPath },
      ];

      // Act
      const index = buildPriorIndex(pointers, tempDir);

      // Assert
      expect(index.entries).toHaveLength(3); // 2 from forecast, 1 from channels

      // Check by_id map - target.orders appears twice
      expect(index.by_id.get('target.orders')).toHaveLength(2);
      expect(index.by_id.get('target.orders')![0].artifact_scope).toBe('forecast');
      expect(index.by_id.get('target.orders')![1].artifact_scope).toBe('channels');

      // Other priors should be unique
      expect(index.by_id.get('constraint.cac')).toHaveLength(1);
    });

    it('should handle empty artifact list', () => {
      // Act
      const index = buildPriorIndex([], tempDir);

      // Assert
      expect(index.entries).toHaveLength(0);
      expect(index.by_id.size).toBe(0);
    });

    it('should handle artifact with no priors', () => {
      // Arrange: artifact with empty priors block
      const emptyPath = path.join(tempDir, 'empty.md');
      const emptyArtifact = `---
Type: Startup-Baseline-Seed
---

# Empty

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

\`\`\`json
[]
\`\`\`
`;
      fs.writeFileSync(emptyPath, emptyArtifact);

      const pointers: ManifestPointer[] = [
        { artifact_scope: 'empty', artifact_path: emptyPath },
      ];

      // Act
      const index = buildPriorIndex(pointers, tempDir);

      // Assert
      expect(index.entries).toHaveLength(0);
      expect(index.by_id.size).toBe(0);
    });
  });

  describe('validateNoDuplicateBareIds', () => {
    it('should pass when all bare prior_ids are unique', () => {
      // Arrange: build index with unique priors
      const forecastPath = path.join(tempDir, 'forecast.md');
      const offerPath = path.join(tempDir, 'offer.md');
      fs.writeFileSync(forecastPath, FIXTURE_FORECAST_ARTIFACT);
      fs.writeFileSync(offerPath, FIXTURE_OFFER_ARTIFACT);

      const pointers: ManifestPointer[] = [
        { artifact_scope: 'forecast', artifact_path: forecastPath },
        { artifact_scope: 'offer', artifact_path: offerPath },
      ];

      const index = buildPriorIndex(pointers, tempDir);

      // Act & Assert - should not throw
      expect(() => validateNoDuplicateBareIds(index)).not.toThrow();
    });

    it('should throw when duplicate bare prior_ids exist', () => {
      // Arrange: build index with duplicate prior_id
      const forecastPath = path.join(tempDir, 'forecast.md');
      const channelsPath = path.join(tempDir, 'channels.md');
      fs.writeFileSync(forecastPath, FIXTURE_FORECAST_ARTIFACT);
      fs.writeFileSync(channelsPath, FIXTURE_CHANNELS_ARTIFACT_DUPLICATE);

      const pointers: ManifestPointer[] = [
        { artifact_scope: 'forecast', artifact_path: forecastPath },
        { artifact_scope: 'channels', artifact_path: channelsPath },
      ];

      const index = buildPriorIndex(pointers, tempDir);

      // Act & Assert - should throw
      expect(() => validateNoDuplicateBareIds(index)).toThrow();
      expect(() => validateNoDuplicateBareIds(index)).toThrow(/ambiguous[\s\S]*target\.orders/i);
    });

    it('should include all ambiguous scopes in error message', () => {
      // Arrange
      const forecastPath = path.join(tempDir, 'forecast.md');
      const channelsPath = path.join(tempDir, 'channels.md');
      fs.writeFileSync(forecastPath, FIXTURE_FORECAST_ARTIFACT);
      fs.writeFileSync(channelsPath, FIXTURE_CHANNELS_ARTIFACT_DUPLICATE);

      const pointers: ManifestPointer[] = [
        { artifact_scope: 'forecast', artifact_path: forecastPath },
        { artifact_scope: 'channels', artifact_path: channelsPath },
      ];

      const index = buildPriorIndex(pointers, tempDir);

      // Act & Assert
      try {
        validateNoDuplicateBareIds(index);
        fail('Expected error to be thrown');
      } catch (error) {
        const errorMsg = (error as Error).message;
        expect(errorMsg).toContain('forecast');
        expect(errorMsg).toContain('channels');
        expect(errorMsg).toContain('target.orders');
      }
    });

    it('should pass with empty index', () => {
      // Arrange
      const emptyIndex: PriorIndex = {
        entries: [],
        by_id: new Map(),
      };

      // Act & Assert
      expect(() => validateNoDuplicateBareIds(emptyIndex)).not.toThrow();
    });
  });

  describe('narrative isolation (VC-LC-03-03)', () => {
    it('should not affect extraction when narrative content changes', () => {
      // Arrange: extract priors from original
      const originalPriors = extractPriors(FIXTURE_FORECAST_ARTIFACT);

      // Modify narrative content
      const modifiedNarrative = FIXTURE_FORECAST_ARTIFACT
        .replace('Forecast narrative content.', 'MODIFIED NARRATIVE CONTENT')
        .replace('More narrative.', 'COMPLETELY DIFFERENT TEXT');

      // Act: extract from modified
      const modifiedPriors = extractPriors(modifiedNarrative);

      // Assert: priors unchanged
      expect(modifiedPriors).toEqual(originalPriors);
      expect(modifiedPriors).toHaveLength(2);
      expect(modifiedPriors[0].id).toBe('target.orders');
      expect(modifiedPriors[1].id).toBe('constraint.cac');
    });

    it('should preserve narrative when serializing updated priors', () => {
      // Arrange: extract and modify priors
      const originalPriors = extractPriors(FIXTURE_FORECAST_ARTIFACT);
      const modifiedPriors = [...originalPriors];
      modifiedPriors[0] = { ...modifiedPriors[0], confidence: 0.9 };

      // Act: serialize and replace
      const newMachineBlock = serializePriors(modifiedPriors, '2026-02-13 14:00 UTC');
      const updatedDoc = replaceMachineBlock(FIXTURE_FORECAST_ARTIFACT, newMachineBlock);

      // Assert: narrative preserved
      expect(updatedDoc).toContain('Forecast narrative content.');
      expect(updatedDoc).toContain('More narrative.');
      expect(updatedDoc).toContain('## Business Context');
      expect(updatedDoc).toContain('## Other Context');

      // Assert: priors updated
      const finalPriors = extractPriors(updatedDoc);
      expect(finalPriors[0].confidence).toBe(0.9);
    });

    it('should preserve frontmatter when modifying machine block', () => {
      // Arrange
      const originalPriors = extractPriors(FIXTURE_FORECAST_ARTIFACT);
      const modifiedPriors = [...originalPriors];
      modifiedPriors[0] = { ...modifiedPriors[0], confidence: 0.85 };

      // Act
      const newMachineBlock = serializePriors(modifiedPriors, '2026-02-13 15:00 UTC');
      const updatedDoc = replaceMachineBlock(FIXTURE_FORECAST_ARTIFACT, newMachineBlock);

      // Assert: frontmatter intact
      expect(updatedDoc).toContain('---');
      expect(updatedDoc).toContain('Type: Startup-Baseline-Seed');
      expect(updatedDoc).toContain('Business: ACME');
      expect(updatedDoc).toContain('Artifact-Scope: forecast');

      // Assert: title intact
      expect(updatedDoc).toContain('# ACME Forecast Seed');
    });
  });
});
