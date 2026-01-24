import fs from 'node:fs';
import path from 'node:path';

import { tokens } from '../src/tailwind-tokens';

const expectedKeys = [
  '--color-bg',
  '--color-fg',
  '--color-primary',
  '--color-primary-fg',
  '--color-accent',
  '--color-accent-fg',
  '--color-danger',
  '--color-danger-fg',
  '--color-success',
  '--color-success-fg',
  '--color-warning',
  '--color-warning-fg',
  '--color-info',
  '--color-info-fg',
  '--color-muted',
  '--color-muted-fg',
  '--color-muted-border',

  // Layered surfaces
  '--surface-1',
  '--surface-2',
  '--surface-3',
  '--surface-input',

  // Border intensity scale
  '--border-1',
  '--border-2',
  '--border-3',

  // Focus rings
  '--ring',
  '--ring-offset',
  '--ring-width',
  '--ring-offset-width',

  // Gradients
  '--gradient-hero-from',
  '--gradient-hero-via',
  '--gradient-hero-to',
  '--font-sans',
  '--font-mono',
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  // Elevation
  '--elevation-0',
  '--elevation-1',
  '--elevation-2',
  '--elevation-3',
  '--elevation-4',
  '--elevation-5',
] as const;

describe('dark theme tokens', () => {
  test('exports expected token keys', () => {
    expect(Object.keys(tokens).sort()).toEqual([...expectedKeys].sort());
  });

  test('css contains token variables', () => {
  const cssPath = path.join(__dirname, '..', 'tokens.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    for (const key of expectedKeys) {
      expect(css).toContain(key);
    }
  });

  test('tokens snapshot', () => {
    expect(tokens).toMatchSnapshot();
  });
});
