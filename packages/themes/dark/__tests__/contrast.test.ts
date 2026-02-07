import { getContrast } from 'polished';

import { tokens } from '../src/tailwind-tokens';

type TokenKey = keyof typeof tokens;

function tokenToHsl(value: string): string {
  return `hsl(${value})`;
}

const colorPairs: [TokenKey, TokenKey][] = [
  ['--color-bg', '--color-fg'],
  ['--color-primary', '--color-primary-fg'],
  ['--color-accent', '--color-accent-fg'],
  ['--color-danger', '--color-danger-fg'],
  // ensure accent and danger colors work against default foreground/background
  ['--color-accent', '--color-fg'],
  ['--color-bg', '--color-accent-fg'],
  ['--color-danger', '--color-fg'],
  ['--color-bg', '--color-danger-fg'],
];

describe('dark theme color contrast', () => {
  test.each(colorPairs)("%s and %s meet WCAG AA", (a, b) => {
    const ratio = getContrast(tokenToHsl(tokens[a]), tokenToHsl(tokens[b]));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
