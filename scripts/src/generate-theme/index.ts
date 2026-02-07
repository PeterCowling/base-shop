/**
 * Theme generation CLI.
 *
 * Generates a new theme package from a brand color.
 *
 * Usage:
 *   pnpm generate-theme --name <theme-name> --primary <hex-color>
 *
 * Example:
 *   pnpm generate-theme --name acme --primary '#336699'
 */

import * as path from 'path';
import { parseArgs } from 'util';

import {
  generatePalette,
  hexToHsl,
  hslToCssValue,
  hslToHex,
  validateAccessibility,
} from './palette';
import { generateTheme, type ThemeConfig,themeExists, validateThemeName } from './scaffold';
import { formatValidationResult,validateTheme } from './validate';

interface CliArgs {
  name?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  surface?: string;
  fontHeading?: string;
  fontBody?: string;
  dark?: boolean;
  output?: string;
  force?: boolean;
  validateOnly?: boolean;
  validateTheme?: string;
  help?: boolean;
}

function printHelp(): void {
  console.log(`
Theme Generation CLI

Generate a new theme package from a brand color with WCAG 2.1 AA compliance.

USAGE:
  pnpm generate-theme --name <theme-name> --primary <hex-color> [options]

REQUIRED:
  --name <name>         Theme name (lowercase, hyphens allowed)
  --primary <color>     Primary brand color (hex, e.g., '#336699')

OPTIONS:
  --secondary <color>   Secondary color (hex) - derived from primary if not set
  --accent <color>      Accent color (hex) - derived from primary if not set
  --surface <color>     Surface/background color (hex) - white by default
  --font-heading <font> Font family for headings
  --font-body <font>    Font family for body text
  --dark                Generate a dark theme variant
  --output <dir>        Output directory (default: packages/themes)
  --force               Overwrite existing theme
  --validate-only       Only validate the color without generating
  --validate-theme <name> Validate an existing theme for accessibility
  --help                Show this help message

EXAMPLES:
  # Generate a basic theme
  pnpm generate-theme --name acme --primary '#336699'

  # Generate with custom accent color
  pnpm generate-theme --name brand --primary '#2563eb' --accent '#7c3aed'

  # Generate dark theme variant
  pnpm generate-theme --name brand-dark --primary '#3b82f6' --dark

  # Validate a color without generating
  pnpm generate-theme --primary '#336699' --validate-only

  # Validate an existing theme
  pnpm generate-theme --validate-theme dark

OUTPUT:
  Creates a theme package at packages/themes/<name>/ with:
  - src/tailwind-tokens.ts  Token overrides
  - src/index.ts            Package exports
  - tokens.css              CSS custom properties
  - __tests__/contrast.test.ts  Accessibility tests
  - package.json            Package configuration
  - tsconfig.json           TypeScript configuration
  - README.md               Theme documentation
`);
}

function parseCliArgs(): CliArgs {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      primary: { type: 'string' },
      secondary: { type: 'string' },
      accent: { type: 'string' },
      surface: { type: 'string' },
      'font-heading': { type: 'string' },
      'font-body': { type: 'string' },
      dark: { type: 'boolean', default: false },
      output: { type: 'string' },
      force: { type: 'boolean', default: false },
      'validate-only': { type: 'boolean', default: false },
      'validate-theme': { type: 'string' },
      help: { type: 'boolean', default: false },
    },
    strict: true,
  });

  return {
    name: values.name,
    primary: values.primary,
    secondary: values.secondary,
    accent: values.accent,
    surface: values.surface,
    fontHeading: values['font-heading'],
    fontBody: values['font-body'],
    dark: values.dark,
    output: values.output,
    force: values.force,
    validateOnly: values['validate-only'],
    validateTheme: values['validate-theme'],
    help: values.help,
  };
}

function validateHexColor(color: string): boolean {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

function normalizeHexColor(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

async function main(): Promise<void> {
  const args = parseCliArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Validate existing theme mode
  if (args.validateTheme) {
    const themesDir = args.output ?? path.join(process.cwd(), 'packages', 'themes');
    const themePath = path.join(themesDir, args.validateTheme);

    console.log(`\nValidating theme: ${args.validateTheme}`);
    const result = await validateTheme(themePath);
    console.log(formatValidationResult(result));

    process.exit(result.valid ? 0 : 1);
  }

  // Validate required args for generation
  if (!args.primary) {
    console.error('Error: --primary color is required');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  if (!validateHexColor(args.primary)) {
    console.error(`Error: Invalid hex color: ${args.primary}`);
    console.error('Expected format: #RGB or #RRGGBB (e.g., #336699)');
    process.exit(1);
  }

  const primaryColor = normalizeHexColor(args.primary);

  // Validate-only mode
  if (args.validateOnly) {
    console.log(`\nValidating color: ${primaryColor}\n`);

    const palette = generatePalette(primaryColor);
    const accessibility = validateAccessibility(palette);

    console.log('Generated Palette:');
    console.log('─'.repeat(70));
    console.log('Shade │ Hex     │ HSL                  │ AA White │ AA Black');
    console.log('─'.repeat(70));

    for (const shade of palette.shades) {
      const aaWhite = shade.aaOnWhite ? '✓' : '✗';
      const aaBlack = shade.aaOnBlack ? '✓' : '✗';
      console.log(
        `${String(shade.shade).padStart(5)} │ ${shade.hex} │ ${shade.cssValue.padEnd(20)} │    ${aaWhite}     │    ${aaBlack}`
      );
    }
    console.log('─'.repeat(70));

    console.log(`\nRecommended text on white: shade ${palette.textOnWhite}`);
    console.log(`Recommended text on black: shade ${palette.textOnBlack}`);

    if (accessibility.valid) {
      console.log('\n✓ Color passes accessibility validation');
    } else {
      console.log('\n✗ Accessibility issues found:');
      for (const issue of accessibility.issues) {
        console.log(`  - ${issue}`);
      }
    }

    if (accessibility.suggestions.length > 0) {
      console.log('\nSuggestions:');
      for (const suggestion of accessibility.suggestions) {
        console.log(`  - ${suggestion}`);
      }
    }

    process.exit(accessibility.valid ? 0 : 1);
  }

  // Generate mode requires name
  if (!args.name) {
    console.error('Error: --name is required when generating a theme');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  // Validate theme name
  const nameValidation = validateThemeName(args.name);
  if (!nameValidation.valid) {
    console.error(`Error: ${nameValidation.error}`);
    process.exit(1);
  }

  // Validate optional colors
  if (args.secondary && !validateHexColor(args.secondary)) {
    console.error(`Error: Invalid secondary color: ${args.secondary}`);
    process.exit(1);
  }
  if (args.accent && !validateHexColor(args.accent)) {
    console.error(`Error: Invalid accent color: ${args.accent}`);
    process.exit(1);
  }
  if (args.surface && !validateHexColor(args.surface)) {
    console.error(`Error: Invalid surface color: ${args.surface}`);
    process.exit(1);
  }

  // Build config
  const config: ThemeConfig = {
    name: args.name,
    primaryColor,
    secondaryColor: args.secondary ? normalizeHexColor(args.secondary) : undefined,
    accentColor: args.accent ? normalizeHexColor(args.accent) : undefined,
    surfaceColor: args.surface ? normalizeHexColor(args.surface) : undefined,
    fontHeading: args.fontHeading,
    fontBody: args.fontBody,
    isDark: args.dark,
  };

  // Check if theme exists
  const themesDir = args.output ?? path.join(process.cwd(), 'packages', 'themes');
  if (!args.force && (await themeExists(args.name, themesDir))) {
    console.error(`Error: Theme "${args.name}" already exists at ${themesDir}/${args.name}`);
    console.error('Use --force to overwrite');
    process.exit(1);
  }

  console.log(`\nGenerating theme: ${args.name}`);
  console.log(`Primary color: ${primaryColor}`);
  if (config.accentColor) console.log(`Accent color: ${config.accentColor}`);
  if (config.isDark) console.log(`Mode: dark`);
  console.log('');

  try {
    const result = await generateTheme(config, {
      outputDir: args.output,
      force: args.force,
    });

    // Validate accessibility
    const accessibility = validateAccessibility(result.palette);

    console.log('Generated files:');
    for (const file of result.files) {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`  ✓ ${relativePath}`);
    }

    console.log(`\nTheme generated at: ${path.relative(process.cwd(), result.outputPath)}`);

    if (!accessibility.valid) {
      console.log('\n⚠ Accessibility warnings:');
      for (const issue of accessibility.issues) {
        console.log(`  - ${issue}`);
      }
    }

    if (accessibility.suggestions.length > 0) {
      console.log('\nSuggestions:');
      for (const suggestion of accessibility.suggestions) {
        console.log(`  - ${suggestion}`);
      }
    }

    console.log('\nNext steps:');
    console.log(`  1. Run: pnpm install`);
    console.log(`  2. Run: pnpm --filter @themes/${args.name} build`);
    console.log(`  3. Use in your shop: --theme ${args.name}`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
