import fs from 'node:fs';
import path from 'node:path';

import { tokens } from '../src/tailwind-tokens';

const expectedKeys = [
  '--color-bg',
  '--color-bg-dark',
  '--color-fg',
  '--color-fg-dark',
  '--color-primary',
  '--color-primary-dark',
  '--color-primary-fg',
  '--color-primary-fg-dark',
  '--color-accent',
  '--color-accent-dark',
  '--color-success',
  '--color-success-dark',
  '--color-success-fg',
  '--color-success-fg-dark',
  '--color-warning',
  '--color-warning-dark',
  '--color-warning-fg',
  '--color-warning-fg-dark',
  '--color-info',
  '--color-info-dark',
  '--color-info-fg',
  '--color-info-fg-dark',
  '--color-muted',
  '--color-muted-dark',
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
] as const;

describe('brandx theme tokens', () => {
  test('exports expected token keys', () => {
    expect(Object.keys(tokens).sort()).toEqual([...expectedKeys].sort());
  });

  test('css contains token variables', () => {
    const cssPath = path.join(__dirname, '..', 'src', 'tokens.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    for (const key of expectedKeys) {
      expect(css).toContain(key);
    }
  });

  test('tokens snapshot', () => {
    expect(tokens).toMatchSnapshot();
  });
});
