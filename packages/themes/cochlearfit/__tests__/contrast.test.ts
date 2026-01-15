import { getContrast } from 'polished';
import { contrastTokens } from '../src/index';

type Mode = 'light' | 'dark';

function tokenToHsl(key: keyof typeof contrastTokens, mode: Mode): string {
  const entry = contrastTokens[key];
  const value = mode === 'dark' ? entry.dark : entry.light;
  return `hsl(${value})`;
}

function expectPair(
  label: string,
  {
    light,
    dark,
  }: {
    light: [keyof typeof contrastTokens, keyof typeof contrastTokens];
    dark?: [keyof typeof contrastTokens, keyof typeof contrastTokens];
  }
): void {
  const [fgLight, bgLight] = light;
  const lightRatio = getContrast(
    tokenToHsl(fgLight, 'light'),
    tokenToHsl(bgLight, 'light')
  );
  expect(lightRatio).toBeGreaterThanOrEqual(4.5);

  if (dark) {
    const [fgDark, bgDark] = dark;
    const darkRatio = getContrast(
      tokenToHsl(fgDark, 'dark'),
      tokenToHsl(bgDark, 'dark')
    );
    expect(darkRatio).toBeGreaterThanOrEqual(4.5);
  }
}

describe('cochlearfit theme color contrast (WCAG AA)', () => {
  test('core foreground/background meets 4.5:1', () => {
    expectPair('fg/bg', {
      light: ['--color-fg', '--color-bg'],
      dark: ['--color-fg', '--color-bg'],
    });
  });

  test('primary color pair meets 4.5:1', () => {
    expectPair('primary', {
      light: ['--color-primary-fg', '--color-primary'],
      dark: ['--color-primary-fg', '--color-primary'],
    });
  });

  test('accent color pair meets 4.5:1', () => {
    expectPair('accent', {
      light: ['--color-accent-fg', '--color-accent'],
      dark: ['--color-accent-fg', '--color-accent'],
    });
  });

  test('success color pair meets 4.5:1', () => {
    expectPair('success', {
      light: ['--color-success-fg', '--color-success'],
      dark: ['--color-success-fg', '--color-success'],
    });
  });

  test('warning color pair meets 4.5:1', () => {
    expectPair('warning', {
      light: ['--color-warning-fg', '--color-warning'],
      dark: ['--color-warning-fg', '--color-warning'],
    });
  });

  test('danger color pair meets 4.5:1', () => {
    expectPair('danger', {
      light: ['--color-danger-fg', '--color-danger'],
      dark: ['--color-danger-fg', '--color-danger'],
    });
  });

  test('info color pair meets 4.5:1', () => {
    expectPair('info', {
      light: ['--color-info-fg', '--color-info'],
      dark: ['--color-info-fg', '--color-info'],
    });
  });

  test('muted surfaces meet 4.5:1', () => {
    expectPair('muted', {
      light: ['--color-muted-fg', '--color-muted'],
      dark: ['--color-muted-fg', '--color-muted'],
    });
  });

  test('layered surfaces meet 4.5:1', () => {
    expectPair('surface-2', {
      light: ['--color-fg', '--surface-2'],
      dark: ['--color-fg', '--surface-2'],
    });
    expectPair('surface-3', {
      light: ['--color-fg', '--surface-3'],
      dark: ['--color-fg', '--surface-3'],
    });
    expectPair('surface-input', {
      light: ['--color-fg', '--surface-input'],
      dark: ['--color-fg', '--surface-input'],
    });
  });
});
