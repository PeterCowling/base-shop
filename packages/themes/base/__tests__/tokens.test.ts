import fs from 'node:fs';
import path from 'node:path';
import { tokens } from '../src/tokens';

const requiredKeys = [
  '--color-bg',
  '--color-fg',
  '--color-primary',
  '--color-primary-fg',
  '--color-muted',
  '--color-focus-ring',
  '--surface-1',
  '--surface-2',
  '--surface-3',
  '--surface-input',
  '--border-1',
  '--border-2',
  '--border-3',
  '--ring',
  '--ring-offset',
  '--ring-width',
  '--ring-offset-width',
] as const;

describe('base theme tokens', () => {
  test('exports expected token keys', () => {
    for (const key of requiredKeys) {
      expect(tokens).toHaveProperty(key);
    }
  });

  test('css contains token variables', () => {
    const cssDir = path.join(__dirname, '..', 'src');
    const cssFiles = ['tokens.css', 'tokens.dynamic.css']
      .map((f) => path.join(cssDir, f))
      .filter(fs.existsSync);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test reads from enumerated CSS files validated by existsSync
    const css = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

    for (const key of requiredKeys) {
      expect(css).toContain(key);
    }
  });

  test('tokens snapshot', () => {
    expect(tokens).toMatchSnapshot();
  });
});
