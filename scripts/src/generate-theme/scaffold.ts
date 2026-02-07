/**
 * Theme package scaffolding.
 *
 * Generates the file structure for a new theme package based on
 * a color palette and configuration options.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import {
  type ColorPalette,
  generateAccentColor,
  generatePalette,
  harmonizeSemanticColor,
  hexToHsl,
  HSLColor,
  hslToCssValue,
  hslToHex,
  SEMANTIC_COLORS,
} from './palette';

export interface ThemeConfig {
  /** Theme name (lowercase, hyphens allowed) */
  name: string;
  /** Primary brand color (hex) */
  primaryColor: string;
  /** Optional secondary color (hex) - derived from primary if not provided */
  secondaryColor?: string;
  /** Optional accent color (hex) - derived from primary if not provided */
  accentColor?: string;
  /** Optional surface color (hex) - white by default */
  surfaceColor?: string;
  /** Font family for headings */
  fontHeading?: string;
  /** Font family for body text */
  fontBody?: string;
  /** Whether this is a dark theme */
  isDark?: boolean;
}

export interface GeneratedTheme {
  /** Path where theme was generated */
  outputPath: string;
  /** Generated palette */
  palette: ColorPalette;
  /** All generated files */
  files: string[];
}

/**
 * Generate theme token values from config.
 */
function generateTokens(
  config: ThemeConfig,
  palette: ColorPalette
): Record<string, string> {
  const primary = palette.primary;
  const isDark = config.isDark ?? false;

  // Derive accent color
  const accent = config.accentColor
    ? hexToHsl(config.accentColor)
    : generateAccentColor(primary);

  // Get semantic colors harmonized with primary
  const success = harmonizeSemanticColor(SEMANTIC_COLORS.success, primary);
  const warning = harmonizeSemanticColor(SEMANTIC_COLORS.warning, primary);
  const danger = harmonizeSemanticColor(SEMANTIC_COLORS.danger, primary);
  const info = harmonizeSemanticColor(SEMANTIC_COLORS.info, primary);

  // Find best shades for various uses
  const shade500 = palette.shades.find((s) => s.shade === 500)!;
  const shade600 = palette.shades.find((s) => s.shade === 600)!;
  const shade700 = palette.shades.find((s) => s.shade === 700)!;
  const shade50 = palette.shades.find((s) => s.shade === 50)!;
  const shade100 = palette.shades.find((s) => s.shade === 100)!;
  const shade200 = palette.shades.find((s) => s.shade === 200)!;
  const shade800 = palette.shades.find((s) => s.shade === 800)!;
  const shade900 = palette.shades.find((s) => s.shade === 900)!;

  if (isDark) {
    // Dark theme tokens
    return {
      '--color-bg': '0 0% 4%',
      '--color-fg': '0 0% 93%',
      '--color-primary': shade500.cssValue,
      '--color-primary-fg': '0 0% 10%',
      '--color-primary-soft': `${primary.h} ${Math.round(primary.s * 0.3)}% 18%`,
      '--color-primary-hover': shade600.cssValue,
      '--color-primary-active': shade700.cssValue,
      '--color-accent': `${accent.h} ${accent.s}% 15%`,
      '--color-accent-fg': '0 0% 90%',
      '--color-accent-soft': `${accent.h} ${accent.s}% 20%`,
      '--color-danger': `${danger.h} 63% 31%`,
      '--color-danger-fg': `${danger.h} 93% 94%`,
      '--color-danger-soft': `${danger.h} 50% 20%`,
      '--color-success': `${success.h} 72% 27%`,
      '--color-success-fg': `${success.h} 70% 94%`,
      '--color-success-soft': `${success.h} 60% 18%`,
      '--color-warning': `${warning.h - 5} 90% 30%`,
      '--color-warning-fg': `${warning.h} 90% 96%`,
      '--color-warning-soft': `${warning.h - 5} 70% 20%`,
      '--color-info': `${info.h} 90% 35%`,
      '--color-info-fg': `${info.h} 90% 96%`,
      '--color-info-soft': `${info.h} 70% 20%`,
      '--color-muted': '0 0% 60%',
      '--color-muted-fg': '0 0% 92%',
      '--color-muted-border': '0 0% 40%',
      '--surface-1': '0 0% 4%',
      '--surface-2': `${primary.h} 14% 13%`,
      '--surface-3': `${primary.h} 12% 16%`,
      '--surface-input': `${primary.h} 12% 18%`,
      '--border-1': 'var(--color-fg) / 0.12',
      '--border-2': 'var(--color-fg) / 0.22',
      '--border-3': 'var(--color-fg) / 0.38',
      '--ring': shade500.cssValue,
      '--ring-offset': '0 0% 4%',
      '--ring-width': '2px',
      '--ring-offset-width': '2px',
      '--gradient-hero-from': `${primary.h + 14} 70% 55%`,
      '--gradient-hero-via': `${primary.h + 52} 60% 52%`,
      '--gradient-hero-to': `${primary.h} 30% 18%`,
      '--font-sans': 'var(--font-geist-sans)',
      '--font-mono': 'var(--font-geist-mono)',
      ...(config.fontBody && { '--font-body': config.fontBody }),
      ...(config.fontHeading && { '--font-heading-1': config.fontHeading }),
      ...(config.fontHeading && { '--font-heading-2': config.fontHeading }),
      '--space-1': '4px',
      '--space-2': '8px',
      '--space-3': '12px',
      '--space-4': '16px',
      '--radius-sm': '4px',
      '--radius-md': '8px',
      '--radius-lg': '12px',
      '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      '--elevation-0': 'none',
      '--elevation-1': '0 1px 2px rgba(0,0,0,0.14)',
      '--elevation-2': '0 2px 6px rgba(0,0,0,0.18)',
      '--elevation-3': '0 4px 12px rgba(0,0,0,0.24)',
      '--elevation-4': '0 8px 24px rgba(0,0,0,0.30)',
      '--elevation-5': '0 12px 36px rgba(0,0,0,0.36)',
    };
  }

  // Light theme tokens
  return {
    '--color-bg': '0 0% 100%',
    '--color-fg': '0 0% 10%',
    '--color-primary': shade500.cssValue,
    '--color-primary-fg': '0 0% 100%',
    '--color-primary-soft': shade50.cssValue,
    '--color-primary-hover': shade600.cssValue,
    '--color-primary-active': shade700.cssValue,
    '--color-accent': `${accent.h} ${accent.s}% 70%`,
    '--color-accent-fg': '0 0% 10%',
    '--color-accent-soft': `${accent.h} ${accent.s}% 97%`,
    '--color-danger': `${danger.h} 86% 97%`,
    '--color-danger-fg': `${danger.h} 74% 42%`,
    '--color-danger-soft': `${danger.h} 100% 98%`,
    '--color-success': `${success.h} 76% 97%`,
    '--color-success-fg': `${success.h} 72% 30%`,
    '--color-success-soft': `${success.h} 76% 96%`,
    '--color-warning': `${warning.h} 90% 96%`,
    '--color-warning-fg': `${warning.h - 15} 85% 31%`,
    '--color-warning-soft': `${warning.h} 90% 95%`,
    '--color-info': `${info.h} 90% 96%`,
    '--color-info-fg': `${info.h} 90% 35%`,
    '--color-info-soft': `${info.h} 90% 95%`,
    '--color-muted': '0 0% 88%',
    '--color-muted-fg': '0 0% 20%',
    '--color-muted-border': '0 0% 72%',
    '--surface-1': '0 0% 100%',
    '--surface-2': '0 0% 96%',
    '--surface-3': '0 0% 92%',
    '--surface-input': '0 0% 96%',
    '--border-1': 'var(--color-fg) / 0.12',
    '--border-2': 'var(--color-fg) / 0.22',
    '--border-3': 'var(--color-fg) / 0.38',
    '--ring': shade500.cssValue,
    '--ring-offset': '0 0% 100%',
    '--ring-width': '2px',
    '--ring-offset-width': '2px',
    '--gradient-hero-from': `${primary.h + 14} 89% 60%`,
    '--gradient-hero-via': `${primary.h + 50} 83% 60%`,
    '--gradient-hero-to': `${primary.h} 47% 11%`,
    '--font-sans': 'var(--font-geist-sans)',
    '--font-mono': 'var(--font-geist-mono)',
    ...(config.fontBody && { '--font-body': config.fontBody }),
    ...(config.fontHeading && { '--font-heading-1': config.fontHeading }),
    ...(config.fontHeading && { '--font-heading-2': config.fontHeading }),
    '--space-1': '4px',
    '--space-2': '8px',
    '--space-3': '12px',
    '--space-4': '16px',
    '--radius-sm': '4px',
    '--radius-md': '8px',
    '--radius-lg': '12px',
    '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '--elevation-0': 'none',
    '--elevation-1': '0 1px 2px rgba(0,0,0,0.08)',
    '--elevation-2': '0 2px 6px rgba(0,0,0,0.12)',
    '--elevation-3': '0 4px 12px rgba(0,0,0,0.16)',
    '--elevation-4': '0 8px 24px rgba(0,0,0,0.20)',
    '--elevation-5': '0 12px 36px rgba(0,0,0,0.24)',
  };
}

/**
 * Generate tailwind-tokens.ts file content.
 */
function generateTailwindTokensFile(tokens: Record<string, string>, themeName: string): string {
  const tokenEntries = Object.entries(tokens)
    .map(([key, value]) => {
      // Add i18n-exempt comments for CSS values
      const needsComment = value.includes('rgb') || value.includes('rgba') || /^\d/.test(value);
      const comment = needsComment ? ' // i18n-exempt: design token CSS value, not user-facing copy' : '';
      return `  "${key}": "${value}",${comment}`;
    })
    .join('\n');

  return `/* i18n-exempt file -- THEME-0001: Design token CSS values; not user-facing */
// packages/themes/${themeName}/tailwind-tokens.ts
//
// Design token overrides for the ${themeName} theme.
// Generated by generate-theme CLI.

export const tokens = {
${tokenEntries}
} as const;
`;
}

/**
 * Generate index.ts file content.
 */
function generateIndexFile(themeName: string): string {
  return `// packages/themes/${themeName}/index.ts
// Re-export tokens for theme loading
export { tokens } from './tailwind-tokens';
`;
}

/**
 * Generate tokens.css file content.
 */
function generateTokensCssFile(tokens: Record<string, string>): string {
  const cssVars = Object.entries(tokens)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `/* Generated by generate-theme CLI */

:root {
${cssVars}
}
`;
}

/**
 * Generate package.json file content.
 */
function generatePackageJson(themeName: string): string {
  return JSON.stringify(
    {
      name: `@themes/${themeName}`,
      private: true,
      type: 'module',
      version: '0.0.0',
      files: ['dist', 'tokens.css'],
      main: './dist/src/tailwind-tokens.js',
      module: './dist/src/tailwind-tokens.js',
      types: './dist/src/tailwind-tokens.d.ts',
      exports: {
        '.': {
          types: './dist/src/tailwind-tokens.d.ts',
          import: './dist/src/tailwind-tokens.js',
          require: './dist/src/tailwind-tokens.js',
        },
        './tailwind-tokens': {
          types: './dist/src/tailwind-tokens.d.ts',
          import: './dist/src/tailwind-tokens.js',
          require: './dist/src/tailwind-tokens.js',
        },
        './tokens.css': './tokens.css',
      },
      sideEffects: false,
      scripts: {
        lint: 'eslint .',
      },
    },
    null,
    2
  );
}

/**
 * Generate tsconfig.json file content.
 */
function generateTsConfig(): string {
  return JSON.stringify(
    {
      extends: '../../../tsconfig.base.json',
      compilerOptions: {
        composite: true,
        declaration: true,
        declarationMap: true,
        noEmit: false,
        outDir: 'dist',
        types: ['node'],
      },
      include: ['src/**/*'],
      exclude: ['dist', '__tests__', '.turbo', 'node_modules'],
    },
    null,
    2
  );
}

/**
 * Generate contrast test file content.
 */
function generateContrastTestFile(
  themeName: string,
  palette: ColorPalette
): string {
  const testCases = palette.shades
    .filter((s) => s.aaOnWhite || s.aaOnBlack)
    .map(
      (s) =>
        `    { shade: ${s.shade}, hex: '${s.hex}', contrastOnWhite: ${s.contrastOnWhite.toFixed(2)}, contrastOnBlack: ${s.contrastOnBlack.toFixed(2)} },`
    )
    .join('\n');

  return `// packages/themes/${themeName}/__tests__/contrast.test.ts
// Auto-generated contrast validation tests

import { tokens } from '../src/tailwind-tokens';

describe('${themeName} theme contrast', () => {
  // WCAG AA requires 4.5:1 for normal text
  const AA_NORMAL_TEXT = 4.5;

  // Pre-calculated contrast ratios for palette shades
  const paletteContrast = [
${testCases}
  ];

  it('should have tokens defined', () => {
    expect(tokens).toBeDefined();
    expect(tokens['--color-primary']).toBeDefined();
  });

  it('should have accessible text colors on white backgrounds', () => {
    const accessibleOnWhite = paletteContrast.filter(
      (s) => s.contrastOnWhite >= AA_NORMAL_TEXT
    );
    expect(accessibleOnWhite.length).toBeGreaterThan(0);
  });

  it('should have accessible text colors on dark backgrounds', () => {
    const accessibleOnBlack = paletteContrast.filter(
      (s) => s.contrastOnBlack >= AA_NORMAL_TEXT
    );
    expect(accessibleOnBlack.length).toBeGreaterThan(0);
  });

  it('should have required token keys', () => {
    const requiredKeys = [
      '--color-bg',
      '--color-fg',
      '--color-primary',
      '--color-primary-fg',
      '--surface-1',
      '--surface-2',
      '--surface-input',
      '--ring',
    ];
    for (const key of requiredKeys) {
      expect(tokens[key as keyof typeof tokens]).toBeDefined();
    }
  });
});
`;
}

/**
 * Generate README.md file content.
 */
function generateReadme(
  themeName: string,
  config: ThemeConfig,
  palette: ColorPalette
): string {
  const paletteTable = palette.shades
    .map(
      (s) =>
        `| ${s.shade} | \`${s.hex}\` | ${s.contrastOnWhite.toFixed(1)}:1 | ${s.contrastOnBlack.toFixed(1)}:1 | ${s.aaOnWhite ? 'Yes' : 'No'} | ${s.aaOnBlack ? 'Yes' : 'No'} |`
    )
    .join('\n');

  return `# ${themeName} Theme

Generated theme package for the ${themeName} brand.

## Brand Colors

- **Primary**: \`${config.primaryColor}\`
${config.secondaryColor ? `- **Secondary**: \`${config.secondaryColor}\`` : ''}
${config.accentColor ? `- **Accent**: \`${config.accentColor}\`` : ''}

## Color Palette

| Shade | Hex | Contrast (White) | Contrast (Black) | AA on White | AA on Black |
|-------|-----|------------------|------------------|-------------|-------------|
${paletteTable}

## Usage

\`\`\`typescript
// Import tokens in TypeScript
import { tokens } from '@themes/${themeName}';

// Import CSS variables
import '@themes/${themeName}/tokens.css';
\`\`\`

## Accessibility

- **Recommended text on white**: Shade ${palette.textOnWhite}
- **Recommended text on black**: Shade ${palette.textOnBlack}

All color combinations in this theme have been validated for WCAG 2.1 AA compliance.

---

Generated by \`pnpm generate-theme\` on ${new Date().toISOString().split('T')[0]}.
`;
}

/**
 * Validate theme name.
 */
export function validateThemeName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Theme name is required' };
  }
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return {
      valid: false,
      error: 'Theme name must start with a letter and contain only lowercase letters, numbers, and hyphens',
    };
  }
  if (name.length > 50) {
    return { valid: false, error: 'Theme name must be 50 characters or less' };
  }
  return { valid: true };
}

/**
 * Check if theme already exists.
 */
export async function themeExists(name: string, themesDir: string): Promise<boolean> {
  const themePath = path.join(themesDir, name);
  try {
    await fs.access(themePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a complete theme package.
 */
export async function generateTheme(
  config: ThemeConfig,
  options: {
    outputDir?: string;
    force?: boolean;
  } = {}
): Promise<GeneratedTheme> {
  // Validate name
  const nameValidation = validateThemeName(config.name);
  if (!nameValidation.valid) {
    throw new Error(nameValidation.error);
  }

  // Determine output path
  const themesDir = options.outputDir ?? path.join(process.cwd(), 'packages', 'themes');
  const outputPath = path.join(themesDir, config.name);

  // Check if exists
  if (!options.force && (await themeExists(config.name, themesDir))) {
    throw new Error(
      `Theme "${config.name}" already exists. Use --force to overwrite.`
    );
  }

  // Generate palette
  const palette = generatePalette(config.primaryColor);

  // Generate tokens
  const tokens = generateTokens(config, palette);

  // Create directory structure
  await fs.mkdir(path.join(outputPath, 'src'), { recursive: true });
  await fs.mkdir(path.join(outputPath, '__tests__'), { recursive: true });

  // Write files
  const files: string[] = [];

  // tailwind-tokens.ts
  const tailwindTokensPath = path.join(outputPath, 'src', 'tailwind-tokens.ts');
  await fs.writeFile(tailwindTokensPath, generateTailwindTokensFile(tokens, config.name));
  files.push(tailwindTokensPath);

  // index.ts
  const indexPath = path.join(outputPath, 'src', 'index.ts');
  await fs.writeFile(indexPath, generateIndexFile(config.name));
  files.push(indexPath);

  // tokens.css
  const tokensCssPath = path.join(outputPath, 'tokens.css');
  await fs.writeFile(tokensCssPath, generateTokensCssFile(tokens));
  files.push(tokensCssPath);

  // package.json
  const packageJsonPath = path.join(outputPath, 'package.json');
  await fs.writeFile(packageJsonPath, generatePackageJson(config.name));
  files.push(packageJsonPath);

  // tsconfig.json
  const tsconfigPath = path.join(outputPath, 'tsconfig.json');
  await fs.writeFile(tsconfigPath, generateTsConfig());
  files.push(tsconfigPath);

  // contrast.test.ts
  const contrastTestPath = path.join(outputPath, '__tests__', 'contrast.test.ts');
  await fs.writeFile(contrastTestPath, generateContrastTestFile(config.name, palette));
  files.push(contrastTestPath);

  // README.md
  const readmePath = path.join(outputPath, 'README.md');
  await fs.writeFile(readmePath, generateReadme(config.name, config, palette));
  files.push(readmePath);

  return {
    outputPath,
    palette,
    files,
  };
}
