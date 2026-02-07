import fs from 'node:fs';
import path from 'node:path';

import { tokens } from '../src/tokens';

const HOSPITALITY_KEYS = [
  '--hospitality-ready',
  '--hospitality-ready-fg',
  '--hospitality-warning',
  '--hospitality-warning-fg',
  '--hospitality-info',
  '--hospitality-info-fg',
  '--hospitality-progress-start',
  '--hospitality-progress-end',
  '--hospitality-motion-celebration-ms',
  '--hospitality-motion-gentle-ms',
] as const;

describe('hospitality semantic tokens', () => {
  it('TC-01: token map includes hospitality keys', () => {
    for (const key of HOSPITALITY_KEYS) {
      expect(tokens).toHaveProperty(key);
    }
  });

  it('TC-01: generated css output includes hospitality variables', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'tokens.css'), 'utf8');
    for (const key of HOSPITALITY_KEYS) {
      expect(css).toContain(key);
    }
  });
});
