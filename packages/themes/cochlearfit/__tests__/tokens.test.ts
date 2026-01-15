import fs from 'node:fs';
import path from 'node:path';
import { tokens } from '../src/index';

const expectedKeys = [
  // Brand colors
  '--color-primary',
  '--color-primary-fg',
  '--color-primary-soft',
  '--color-primary-hover',
  '--color-primary-active',
  '--color-accent',
  '--color-accent-fg',
  '--color-accent-soft',
  // Core surfaces
  '--color-bg',
  '--color-fg',
  // Extended palette
  '--color-sand',
  '--color-ocean',
  '--color-berry',
  '--color-info',
  // Surfaces
  '--surface-1',
  '--surface-2',
  '--surface-3',
  '--surface-input',
  // Status colors
  '--color-success',
  '--color-success-fg',
  '--color-warning',
  '--color-warning-fg',
  '--color-danger',
  '--color-danger-fg',
  // Focus ring
  '--ring',
  '--ring-offset',
  // Muted tones
  '--color-muted',
  '--color-fg-muted',
  // Gradient tokens
  '--gradient-hero-from',
  '--gradient-hero-via',
  '--gradient-hero-to',
] as const;

describe('cochlearfit theme tokens', () => {
  test('exports expected token keys', () => {
    expect(Object.keys(tokens).sort()).toEqual([...expectedKeys].sort());
  });

  test('css file exists and contains token variables', () => {
    const cssPath = path.join(__dirname, '..', 'src', 'tokens.css');
    expect(fs.existsSync(cssPath)).toBe(true);

    const css = fs.readFileSync(cssPath, 'utf8');

    // Check core tokens are in CSS
    const coreTokens = [
      '--color-primary',
      '--color-primary-fg',
      '--color-accent',
      '--color-bg',
      '--color-fg',
      '--ring',
    ];
    for (const key of coreTokens) {
      expect(css).toContain(key);
    }
  });

  test('css contains dark mode selectors', () => {
    const cssPath = path.join(__dirname, '..', 'src', 'tokens.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('html.theme-dark');
  });

  test('tokens snapshot', () => {
    expect(tokens).toMatchSnapshot();
  });

  test('primary color is coral/terracotta hue', () => {
    // Cochlearfit primary should be in the coral/terracotta range (hue ~9)
    const primary = tokens['--color-primary'];
    expect(primary).toMatch(/^9\s/);
  });

  test('background color is warm sandy cream', () => {
    // Background should be warm sandy/cream (hue ~42)
    const bg = tokens['--color-bg'];
    expect(bg).toMatch(/^42\s/);
  });
});
