import fs from 'node:fs';
import path from 'node:path';
import { tokens } from '../src/tokens';

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

describe('base theme tokens', () => {
  test('exports expected token keys', () => {
    expect(Object.keys(tokens).sort()).toEqual([...expectedKeys].sort());
  });

  test('css contains token variables', () => {
    const cssDir = path.join(__dirname, '..', 'src');
    const cssFiles = ['tokens.css', 'tokens.dynamic.css']
      .map((f) => path.join(cssDir, f))
      .filter(fs.existsSync);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test reads from enumerated CSS files validated by existsSync
    const css = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

    for (const key of expectedKeys) {
      expect(css).toContain(key);
    }
  });

  test('tokens snapshot', () => {
    expect(tokens).toMatchSnapshot();
  });
});
