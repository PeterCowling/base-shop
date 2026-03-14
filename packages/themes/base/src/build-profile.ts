/**
 * Profile CSS Generator
 *
 * Generates CSS custom properties from a DesignProfile.
 * Category A fields compile to CSS variables directly.
 * Category B fields resolve enums to existing token values.
 * Category C fields are agent-only guidance and are NOT emitted.
 *
 * @example
 * ```ts
 * import { generateProfileCSS } from "@themes/base/build-profile";
 * import { profile } from "@themes/caryina/design-profile";
 *
 * const css = generateProfileCSS(profile, "caryina");
 * // Write to profile.css or inject at build time
 * ```
 */

import type {
  Border,
  DeepPartial,
  DesignProfile,
  Elevation,
  MotionProfile,
  Radius,
  SpaceProfile,
  SurfaceMode,
  TypographyProfile,
} from "./theme-expression";

// ═══════════════════════════════════════════
// Category B enum → token resolution tables
// ═══════════════════════════════════════════

const RADIUS_MAP: Record<Radius, string> = {
  none: "0",
  sm: "var(--radius-sm, 0.125rem)",
  md: "var(--radius-md, 0.375rem)",
  lg: "var(--radius-lg, 0.5rem)",
  xl: "var(--radius-xl, 0.75rem)",
};

const ELEVATION_MAP: Record<Elevation, string> = {
  flat: "none",
  subtle: "var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05))",
  moderate: "var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1))",
  layered: "var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1))",
};

const BORDER_MAP: Record<Border, string> = {
  none: "0 solid transparent",
  subtle: "1px solid var(--color-border-muted, hsl(0 0% 88%))",
  defined: "1px solid var(--color-border, hsl(0 0% 80%))",
  bold: "2px solid var(--color-border-strong, hsl(0 0% 65%))",
};

// ═══════════════════════════════════════════
// Type scale computation
// ═══════════════════════════════════════════

/**
 * Generates modular type scale steps from -2 through 6.
 * Step 0 = bodySize (1rem by default).
 * Each step multiplies/divides by scaleRatio.
 */
function computeTypeScaleVars(
  scaleRatio: number,
  bodySize: string,
): Record<string, string> {
  const vars: Record<string, string> = {};
  // Parse the numeric part of bodySize for computation
  const match = bodySize.match(/^([\d.]+)(rem|px|em)$/);
  if (!match) {
    // Fallback: emit bodySize as step-0 and compute relative steps
    vars["--type-step-0"] = bodySize;
    for (let i = 1; i <= 6; i++) {
      vars[`--type-step-${i}`] = `calc(${bodySize} * ${Math.pow(scaleRatio, i).toFixed(4)})`;
    }
    for (let i = -1; i >= -2; i--) {
      vars[`--type-step-${i}`] = `calc(${bodySize} * ${Math.pow(scaleRatio, i).toFixed(4)})`;
    }
    return vars;
  }

  const base = parseFloat(match[1]);
  const unit = match[2];

  for (let step = -2; step <= 6; step++) {
    const value = base * Math.pow(scaleRatio, step);
    // Round to 4 decimal places to avoid floating-point noise
    vars[`--type-step-${step}`] = `${parseFloat(value.toFixed(4))}${unit}`;
  }

  return vars;
}

// ═══════════════════════════════════════════
// CSS generation helpers
// ═══════════════════════════════════════════

function formatBlock(selector: string, vars: Record<string, string>): string {
  const entries = Object.entries(vars);
  if (entries.length === 0) return "";
  const lines = entries.map(([prop, value]) => `  ${prop}: ${value};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

// ═══════════════════════════════════════════
// Category A: compile-time variable emission
// ═══════════════════════════════════════════

function emitTypographyVars(typo: TypographyProfile): Record<string, string> {
  const vars: Record<string, string> = {
    "--profile-type-scale-ratio": String(typo.scaleRatio),
    "--profile-type-body-size": typo.bodySize,
    "--profile-type-body-leading": String(typo.bodyLeading),
    "--profile-type-body-measure": typo.bodyMeasure,
    "--profile-type-display-weight": String(typo.displayWeight),
    "--profile-type-label-tracking": typo.labelTracking,
  };
  // Computed type scale steps
  Object.assign(vars, computeTypeScaleVars(typo.scaleRatio, typo.bodySize));
  return vars;
}

function emitMotionVars(motion: MotionProfile): Record<string, string> {
  return {
    "--profile-motion-fast": motion.durationFast,
    "--profile-motion-normal": motion.durationNormal,
    "--profile-motion-slow": motion.durationSlow,
    "--profile-motion-easing": motion.easing,
  };
}

function emitSpaceVars(space: SpaceProfile): Record<string, string> {
  return {
    "--profile-space-section-gap": space.sectionGap,
    "--profile-space-component-gap": space.componentGap,
    "--profile-space-content-max-width": space.contentMaxWidth,
    "--profile-space-card-padding": space.cardPadding,
  };
}

// ═══════════════════════════════════════════
// Category B: enum-to-token emission
// ═══════════════════════════════════════════

function emitSurfaceVars(profile: DesignProfile): Record<string, string> {
  return {
    "--profile-card-radius": RADIUS_MAP[profile.surface.defaultRadius],
    "--profile-card-elevation": ELEVATION_MAP[profile.surface.defaultElevation],
    "--profile-card-border": BORDER_MAP[profile.surface.defaultBorder],
  };
}

function emitComponentVars(profile: DesignProfile): Record<string, string> {
  return {
    "--profile-button-tone": profile.components.buttonTone,
    "--profile-input-style": profile.components.inputStyle,
    "--profile-table-style": profile.components.tableStyle,
  };
}

// ═══════════════════════════════════════════
// Collect all baseline vars from a profile
// ═══════════════════════════════════════════

function collectProfileVars(profile: DesignProfile): Record<string, string> {
  return {
    ...emitTypographyVars(profile.typography),
    ...emitMotionVars(profile.motion),
    ...emitSpaceVars(profile.space),
    ...emitSurfaceVars(profile),
    ...emitComponentVars(profile),
  };
}

// ═══════════════════════════════════════════
// Mode override: deep-merge partial → vars
// ═══════════════════════════════════════════

function collectModeOverrideVars(
  modeOverride: DeepPartial<Omit<DesignProfile, "modes">>,
  baseProfile: DesignProfile,
): Record<string, string> {
  const vars: Record<string, string> = {};

  if (modeOverride.typography) {
    const merged: TypographyProfile = {
      ...baseProfile.typography,
      ...modeOverride.typography,
    };
    Object.assign(vars, emitTypographyVars(merged));
  }

  if (modeOverride.motion) {
    const merged: MotionProfile = {
      ...baseProfile.motion,
      ...modeOverride.motion,
    };
    Object.assign(vars, emitMotionVars(merged));
  }

  if (modeOverride.space) {
    const merged: SpaceProfile = {
      ...baseProfile.space,
      ...modeOverride.space,
    };
    Object.assign(vars, emitSpaceVars(merged));
  }

  if (modeOverride.surface) {
    const mergedProfile: DesignProfile = {
      ...baseProfile,
      surface: { ...baseProfile.surface, ...modeOverride.surface },
    };
    Object.assign(vars, emitSurfaceVars(mergedProfile));
  }

  if (modeOverride.components) {
    const mergedProfile: DesignProfile = {
      ...baseProfile,
      components: { ...baseProfile.components, ...modeOverride.components },
    };
    Object.assign(vars, emitComponentVars(mergedProfile));
  }

  return vars;
}

// ═══════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════

/**
 * Generates CSS custom properties from a DesignProfile.
 *
 * @param profile - The design profile to compile
 * @param themeName - Theme identifier used for CSS scoping.
 *   - `"base"` scopes to `:root`
 *   - Any other name scopes to `[data-theme="{themeName}"]`
 * @returns Complete CSS string with baseline and mode-scoped variables
 */
export function generateProfileCSS(
  profile: DesignProfile,
  themeName: string,
): string {
  const blocks: string[] = [];

  // Baseline selector
  const baselineSelector =
    themeName === "base" ? ":root" : `[data-theme="${themeName}"]`;

  // Emit baseline vars
  const baselineVars = collectProfileVars(profile);
  const baselineBlock = formatBlock(baselineSelector, baselineVars);
  if (baselineBlock) blocks.push(baselineBlock);

  // Emit mode overrides
  if (profile.modes) {
    const modeNames = Object.keys(profile.modes) as SurfaceMode[];
    for (const modeName of modeNames) {
      const modeOverride = profile.modes[modeName];
      if (!modeOverride) continue;

      const modeVars = collectModeOverrideVars(modeOverride, profile);
      if (Object.keys(modeVars).length === 0) continue;

      // Mode vars are scoped to [data-surface="{mode}"] nested under the theme selector
      const modeSelector =
        themeName === "base"
          ? `[data-surface="${modeName}"]`
          : `[data-theme="${themeName}"] [data-surface="${modeName}"]`;

      const modeBlock = formatBlock(modeSelector, modeVars);
      if (modeBlock) blocks.push(modeBlock);
    }
  }

  return blocks.join("\n\n") + "\n";
}

// Re-export mapping tables for component-level consumers that may need
// to resolve enums programmatically (e.g., Storybook controls).
export { BORDER_MAP,ELEVATION_MAP, RADIUS_MAP };
