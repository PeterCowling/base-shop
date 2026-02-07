/**
 * Theme accessibility validation.
 *
 * Validates existing themes for WCAG 2.1 AA compliance and token completeness.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import {
  contrastRatio,
  hexToRgb,
  type RGBColor,
} from './palette';

// Required token keys that all themes must define
export const REQUIRED_TOKENS = [
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
  '--color-muted-fg',
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

// Token pairs that should have sufficient contrast
export const CONTRAST_PAIRS: Array<{ bg: string; fg: string; minRatio: number; description: string }> = [
  { bg: '--color-bg', fg: '--color-fg', minRatio: 4.5, description: 'Text on background' },
  { bg: '--color-primary', fg: '--color-primary-fg', minRatio: 4.5, description: 'Primary button text' },
  { bg: '--color-accent', fg: '--color-accent-fg', minRatio: 4.5, description: 'Accent button text' },
  { bg: '--color-danger', fg: '--color-danger-fg', minRatio: 4.5, description: 'Danger text' },
  { bg: '--color-success', fg: '--color-success-fg', minRatio: 4.5, description: 'Success text' },
  { bg: '--color-warning', fg: '--color-warning-fg', minRatio: 4.5, description: 'Warning text' },
  { bg: '--color-info', fg: '--color-info-fg', minRatio: 4.5, description: 'Info text' },
  { bg: '--surface-1', fg: '--color-fg', minRatio: 4.5, description: 'Text on surface' },
  { bg: '--surface-input', fg: '--color-fg', minRatio: 4.5, description: 'Input text' },
];

export interface ValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  token?: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  themeName: string;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    tokensChecked: number;
    contrastPairsChecked: number;
  };
}

/**
 * Parse HSL CSS value to RGB.
 * Handles format: "H S% L%" (e.g., "220 90% 56%")
 */
function parseHslCssValue(value: string): RGBColor | null {
  // Handle CSS var references
  if (value.includes('var(')) {
    return null; // Can't resolve CSS vars statically
  }

  // Match HSL format: "H S% L%"
  const hslMatch = value.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!hslMatch) {
    return null;
  }

  const h = parseFloat(hslMatch[1]);
  const s = parseFloat(hslMatch[2]);
  const l = parseFloat(hslMatch[3]);

  // Convert HSL to RGB
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  if (sNorm === 0) {
    const gray = Math.round(lNorm * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

/**
 * Load tokens from a theme package.
 */
export async function loadThemeTokens(
  themePath: string
): Promise<Record<string, string> | null> {
  const tokensPath = path.join(themePath, 'src', 'tailwind-tokens.ts');

  try {
    const content = await fs.readFile(tokensPath, 'utf-8');

    // Parse the tokens object from the file
    const tokensMatch = content.match(/export const tokens\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
    if (!tokensMatch) {
      return null;
    }

    const tokensContent = tokensMatch[1];
    const tokens: Record<string, string> = {};

    // Parse each token line
    const tokenRegex = /"(--[^"]+)":\s*"([^"]+)"/g;
    let match;
    while ((match = tokenRegex.exec(tokensContent)) !== null) {
      tokens[match[1]] = match[2];
    }

    return tokens;
  } catch {
    return null;
  }
}

/**
 * Validate a theme's tokens for completeness and accessibility.
 */
export function validateThemeTokens(
  tokens: Record<string, string>,
  themeName: string
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Check for required tokens
  for (const requiredToken of REQUIRED_TOKENS) {
    if (!(requiredToken in tokens)) {
      issues.push({
        severity: 'error',
        code: 'MISSING_TOKEN',
        message: `Missing required token: ${requiredToken}`,
        token: requiredToken,
      });
    }
  }

  // Check contrast pairs
  let contrastPairsChecked = 0;
  for (const pair of CONTRAST_PAIRS) {
    const bgValue = tokens[pair.bg];
    const fgValue = tokens[pair.fg];

    if (!bgValue || !fgValue) {
      continue; // Skip if tokens are missing (already reported above)
    }

    const bgRgb = parseHslCssValue(bgValue);
    const fgRgb = parseHslCssValue(fgValue);

    if (!bgRgb || !fgRgb) {
      issues.push({
        severity: 'warning',
        code: 'UNRESOLVABLE_COLOR',
        message: `Cannot validate contrast for ${pair.description}: color value uses CSS variables`,
        details: { bg: pair.bg, fg: pair.fg },
      });
      continue;
    }

    contrastPairsChecked++;
    const ratio = contrastRatio(bgRgb, fgRgb);

    if (ratio < pair.minRatio) {
      issues.push({
        severity: 'error',
        code: 'INSUFFICIENT_CONTRAST',
        message: `${pair.description}: contrast ratio ${ratio.toFixed(2)}:1 is below ${pair.minRatio}:1 minimum`,
        details: {
          bg: pair.bg,
          bgValue,
          fg: pair.fg,
          fgValue,
          ratio: ratio.toFixed(2),
          required: pair.minRatio,
        },
      });
    }
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;

  return {
    valid: errors === 0,
    themeName,
    issues,
    summary: {
      errors,
      warnings,
      tokensChecked: Object.keys(tokens).length,
      contrastPairsChecked,
    },
  };
}

/**
 * Validate a theme directory.
 */
export async function validateTheme(themePath: string): Promise<ValidationResult> {
  const themeName = path.basename(themePath);

  // Check if theme directory exists
  try {
    await fs.access(themePath);
  } catch {
    return {
      valid: false,
      themeName,
      issues: [
        {
          severity: 'error',
          code: 'THEME_NOT_FOUND',
          message: `Theme directory not found: ${themePath}`,
        },
      ],
      summary: { errors: 1, warnings: 0, tokensChecked: 0, contrastPairsChecked: 0 },
    };
  }

  // Load tokens
  const tokens = await loadThemeTokens(themePath);
  if (!tokens) {
    return {
      valid: false,
      themeName,
      issues: [
        {
          severity: 'error',
          code: 'TOKENS_NOT_FOUND',
          message: `Could not load tokens from ${themePath}/src/tailwind-tokens.ts`,
        },
      ],
      summary: { errors: 1, warnings: 0, tokensChecked: 0, contrastPairsChecked: 0 },
    };
  }

  return validateThemeTokens(tokens, themeName);
}

/**
 * Format validation result for console output.
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push(`\nTheme: ${result.themeName}`);
  lines.push('─'.repeat(50));

  if (result.valid) {
    lines.push('✓ Theme passes validation');
  } else {
    lines.push('✗ Theme has validation errors');
  }

  lines.push(`\nSummary:`);
  lines.push(`  Tokens checked: ${result.summary.tokensChecked}`);
  lines.push(`  Contrast pairs checked: ${result.summary.contrastPairsChecked}`);
  lines.push(`  Errors: ${result.summary.errors}`);
  lines.push(`  Warnings: ${result.summary.warnings}`);

  if (result.issues.length > 0) {
    lines.push('\nIssues:');
    for (const issue of result.issues) {
      const icon = issue.severity === 'error' ? '✗' : '⚠';
      lines.push(`  ${icon} [${issue.code}] ${issue.message}`);
      if (issue.details) {
        for (const [key, value] of Object.entries(issue.details)) {
          lines.push(`      ${key}: ${value}`);
        }
      }
    }
  }

  return lines.join('\n');
}
