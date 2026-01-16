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
  // Skylar extended palette
  '--skylar-gold',
  '--skylar-cream',
  '--skylar-charcoal',
  // EN locale palette
  '--skylar-en-cream',
  '--skylar-en-panel',
  '--skylar-en-accent',
  '--skylar-en-secondary',
  '--skylar-en-gold',
  '--skylar-en-ink',
  // IT locale palette
  '--it-ink',
  '--it-secondary',
  '--it-ground',
  '--it-gold',
  '--it-sage',
  // Surfaces
  '--surface-1',
  '--surface-2',
  '--surface-3',
  '--surface-input',
  // Status colors
  '--color-success',
  '--color-success-fg',
  '--color-info',
  '--color-info-fg',
  '--color-warning',
  '--color-warning-fg',
  '--color-danger',
  '--color-danger-fg',
  // Focus ring
  '--ring',
  '--ring-offset',
] as const;

describe('skylar theme tokens', () => {
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

  test('css contains locale-specific tokens', () => {
    const cssPath = path.join(__dirname, '..', 'src', 'tokens.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // Check for EN locale tokens
    expect(css).toContain('--skylar-en-accent');
    expect(css).toContain('--skylar-en-gold');

    // Check for IT locale tokens
    expect(css).toContain('--it-ink');
    expect(css).toContain('--it-gold');
  });

  test('tokens snapshot', () => {
    expect(tokens).toMatchSnapshot();
  });

  test('primary color is vermilion hue', () => {
    // Skylar primary should be vermilion/burnt orange (hue ~11.7)
    const primary = tokens['--color-primary'];
    expect(primary).toMatch(/^11\.7\s/);
  });

  test('accent color is gold hue', () => {
    // Skylar accent should be gold (hue ~45)
    const accent = tokens['--color-accent'];
    expect(accent).toMatch(/^45\s/);
  });

  test('background color is cream', () => {
    // Background should be cream/off-white (hue ~40)
    const bg = tokens['--color-bg'];
    expect(bg).toMatch(/^40\s/);
  });
});
