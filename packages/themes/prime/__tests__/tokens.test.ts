import fs from 'node:fs';
import path from 'node:path';

import { tokens } from '../src/tokens';

const expectedKeys = [
  '--color-primary',
  '--color-primary-fg',
  '--color-primary-soft',
  '--color-primary-hover',
  '--color-primary-active',
  '--color-accent',
  '--color-accent-fg',
  '--color-accent-soft',
  '--font-sans',
  '--radius-md',
  '--radius-lg',
] as const;

describe('prime theme tokens', () => {
  test('exports expected token keys', () => {
    expect(Object.keys(tokens).sort()).toEqual([...expectedKeys].sort());
  });

  test('css contains token variables', () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
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
