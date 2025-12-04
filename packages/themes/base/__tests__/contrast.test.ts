import { getContrast } from 'polished';
import { tokens } from '../src/tokens';

type Mode = 'light' | 'dark';

function tokenToHsl(key: keyof typeof tokens, mode: Mode): string {
  const entry = tokens[key];
  const value = mode === 'dark' ? entry.dark ?? entry.light : entry.light;
  return `hsl(${value})`;
}

function expectPair(
  label: string,
  { light, dark }: { light: [keyof typeof tokens, keyof typeof tokens]; dark?: [keyof typeof tokens, keyof typeof tokens] }
): void {
  const [fgLight, bgLight] = light;
  const lightRatio = getContrast(tokenToHsl(fgLight, 'light'), tokenToHsl(bgLight, 'light'));
  expect(lightRatio).toBeGreaterThanOrEqual(4.5);

  if (dark) {
    const [fgDark, bgDark] = dark;
    const darkRatio = getContrast(tokenToHsl(fgDark, 'dark'), tokenToHsl(bgDark, 'dark'));
    expect(darkRatio).toBeGreaterThanOrEqual(4.5);
  }
}

describe('base theme color contrast', () => {
  test('core foreground/background', () => {
    expectPair('fg/bg', { light: ['--color-fg', '--color-bg'], dark: ['--color-fg', '--color-bg'] });
  });

  test('brand pairs', () => {
    expectPair('primary', { light: ['--color-primary-fg', '--color-primary'], dark: ['--color-primary-fg', '--color-primary'] });
    expectPair('accent', { light: ['--color-accent-fg', '--color-accent'], dark: ['--color-accent-fg', '--color-accent'] });
    expectPair('danger', { light: ['--color-danger-fg', '--color-danger'], dark: ['--color-danger-fg', '--color-danger'] });
  });

  test('status pairs', () => {
    expectPair('success', { light: ['--color-success-fg', '--color-success'], dark: ['--color-success-fg', '--color-success'] });
    expectPair('warning', { light: ['--color-warning-fg', '--color-warning'], dark: ['--color-warning-fg', '--color-warning'] });
    expectPair('info', { light: ['--color-info-fg', '--color-info'], dark: ['--color-info-fg', '--color-info'] });
  });

  test('muted surfaces', () => {
    expectPair('muted', { light: ['--color-muted-fg', '--color-muted'], dark: ['--color-muted-fg', '--color-muted'] });
  });

  test('layered surfaces and inputs', () => {
    expectPair('surface-2', { light: ['--color-fg', '--surface-2'], dark: ['--color-fg', '--surface-2'] });
    expectPair('surface-3', { light: ['--color-fg', '--surface-3'], dark: ['--color-fg', '--surface-3'] });
    expectPair('surface-input', { light: ['--color-fg', '--surface-input'], dark: ['--color-fg', '--surface-input'] });
  });
});
