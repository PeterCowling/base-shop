import { z } from "zod";

import { localeSchema } from "@acme/types";

// ============================================================
// Brand Kit Schema (LAUNCH-26)
// ============================================================

/**
 * Logo variants for different contexts and screen sizes.
 * Keys are variant identifiers, values are URLs.
 */
export const logoVariantsSchema = z.record(
  z.string().describe("Variant key (e.g., 'desktop-landscape', 'mobile', 'dark')"),
  z.string().url().describe("Logo URL")
);

export type LogoVariants = z.infer<typeof logoVariantsSchema>;

/**
 * Standard logo variants used across the platform.
 */
export const STANDARD_LOGO_VARIANTS = [
  "desktop-landscape", // Primary horizontal logo (header)
  "desktop-square", // Square logo (favicon-like contexts)
  "mobile", // Mobile-optimized logo
  "dark", // Logo for dark backgrounds
  "light", // Logo for light backgrounds
  "social", // Social media sharing (1200x630 recommended)
] as const;

export type StandardLogoVariant = (typeof STANDARD_LOGO_VARIANTS)[number];

/**
 * Favicon configuration with multiple sizes for different contexts.
 */
export const faviconConfigSchema = z.object({
  /** Primary favicon URL (used for .ico generation) */
  primary: z.string().url(),
  /** Optional: Pre-generated sizes */
  sizes: z
    .object({
      "16x16": z.string().url().optional(),
      "32x32": z.string().url().optional(),
      "48x48": z.string().url().optional(),
      "180x180": z.string().url().optional(), // Apple touch icon
      "192x192": z.string().url().optional(), // Android
      "512x512": z.string().url().optional(), // PWA
    })
    .strict()
    .optional(),
});

export type FaviconConfig = z.infer<typeof faviconConfigSchema>;

/**
 * Color palette for brand theming.
 * Uses semantic color names that map to design tokens.
 */
export const colorPaletteSchema = z.object({
  /** Primary brand color (buttons, links, accents) */
  primary: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .describe("Primary brand color"),
  /** Secondary brand color */
  secondary: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  /** Accent color for highlights */
  accent: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  /** Background color */
  background: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  /** Text color */
  text: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  /** Success state color */
  success: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  /** Error state color */
  error: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  /** Warning state color */
  warning: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export type ColorPalette = z.infer<typeof colorPaletteSchema>;

/**
 * Typography configuration for brand fonts.
 */
export const typographyConfigSchema = z.object({
  /** Primary font family for headings */
  headingFont: z.string().optional(),
  /** Primary font family for body text */
  bodyFont: z.string().optional(),
  /** Monospace font for code/technical content */
  monoFont: z.string().optional(),
  /** Font weights to load (for variable fonts) */
  weights: z.array(z.number().int().min(100).max(900)).optional(),
  /** Optional: Google Fonts URL */
  googleFontsUrl: z.string().url().optional(),
  /** Optional: Custom font CSS URL */
  customFontsCss: z.string().url().optional(),
});

export type TypographyConfig = z.infer<typeof typographyConfigSchema>;

/**
 * Social media branding configuration.
 */
export const socialBrandingSchema = z.object({
  /** Default social share image (1200x630 recommended for OG) */
  defaultImage: z.string().url().optional(),
  /** Twitter card type */
  twitterCard: z.enum(["summary", "summary_large_image"]).optional(),
  /** Twitter handle (@username) */
  twitterHandle: z.string().optional(),
  /** Facebook App ID */
  facebookAppId: z.string().optional(),
  /** Instagram handle */
  instagramHandle: z.string().optional(),
});

export type SocialBranding = z.infer<typeof socialBrandingSchema>;

/**
 * Complete Brand Kit schema.
 * Encompasses all visual identity elements for a shop.
 */
export const brandKitSchema = z.object({
  /** Schema version for migrations */
  version: z.literal(1).default(1),

  /** Brand name (may differ from shop name) */
  brandName: z.string().min(1).optional(),

  /** Tagline or slogan */
  tagline: z.record(localeSchema, z.string()).optional(),

  /** Logo variants for different contexts */
  logo: logoVariantsSchema.optional(),

  /** Favicon configuration */
  favicon: z
    .union([z.string().url(), faviconConfigSchema])
    .optional()
    .transform((val) => {
      if (typeof val === "string") {
        return { primary: val };
      }
      return val;
    }),

  /** Color palette */
  colors: colorPaletteSchema.optional(),

  /** Typography configuration */
  typography: typographyConfigSchema.optional(),

  /** Social media branding */
  social: socialBrandingSchema.optional(),

  /** SEO defaults (title template, description) */
  seoDefaults: z
    .object({
      titleTemplate: z.string().optional().describe("e.g., '%s | Brand Name'"),
      defaultTitle: z.record(localeSchema, z.string()).optional(),
      defaultDescription: z.record(localeSchema, z.string()).optional(),
    })
    .strict()
    .optional(),
});

export type BrandKit = z.infer<typeof brandKitSchema>;

// ============================================================
// Brand Kit Validation
// ============================================================

export interface BrandKitValidationResult {
  valid: boolean;
  errors: BrandKitValidationError[];
  warnings: BrandKitValidationWarning[];
}

export interface BrandKitValidationError {
  field: string;
  message: string;
  code: string;
}

export interface BrandKitValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Validate a brand kit configuration.
 * Returns errors for missing required fields and warnings for best practices.
 */
export function validateBrandKit(kit: BrandKit): BrandKitValidationResult {
  const errors: BrandKitValidationError[] = [];
  const warnings: BrandKitValidationWarning[] = [];

  // Check for primary logo variant
  if (!kit.logo || Object.keys(kit.logo).length === 0) {
    errors.push({
      field: "logo",
      message: "At least one logo variant is required",
      code: "MISSING_LOGO",
    });
  } else if (!kit.logo["desktop-landscape"]) {
    warnings.push({
      field: "logo",
      message: "Missing 'desktop-landscape' logo variant",
      suggestion: "Add a horizontal logo for header display",
    });
  }

  // Check favicon
  if (!kit.favicon) {
    errors.push({
      field: "favicon",
      message: "Favicon is required for brand identity",
      code: "MISSING_FAVICON",
    });
  }

  // Check primary color
  if (!kit.colors?.primary) {
    warnings.push({
      field: "colors.primary",
      message: "No primary brand color defined",
      suggestion: "Define a primary color for consistent theming",
    });
  }

  // Check social sharing image
  if (!kit.social?.defaultImage && !kit.logo?.social) {
    warnings.push({
      field: "social.defaultImage",
      message: "No social sharing image defined",
      suggestion: "Add a 1200x630 image for social media previews",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================
// Brand Kit Utilities
// ============================================================

/**
 * Get the best logo URL for a given context.
 */
export function getLogoForContext(
  kit: BrandKit,
  context: "header" | "footer" | "mobile" | "social" | "dark" | "light"
): string | undefined {
  if (!kit.logo) return undefined;

  const preferenceOrder: Record<string, string[]> = {
    header: ["desktop-landscape", "mobile", "desktop-square"],
    footer: ["desktop-landscape", "desktop-square", "mobile"],
    mobile: ["mobile", "desktop-square", "desktop-landscape"],
    social: ["social", "desktop-landscape", "desktop-square"],
    dark: ["dark", "desktop-landscape", "mobile"],
    light: ["light", "desktop-landscape", "mobile"],
  };

  const preferences = preferenceOrder[context] || ["desktop-landscape"];

  for (const variant of preferences) {
    if (kit.logo[variant]) {
      return kit.logo[variant];
    }
  }

  // Return first available logo as fallback
  const logoKeys = Object.keys(kit.logo);
  return logoKeys.length > 0 ? kit.logo[logoKeys[0]] : undefined;
}

/**
 * Get favicon URL for a specific size.
 */
export function getFaviconForSize(
  kit: BrandKit,
  size: "16x16" | "32x32" | "48x48" | "180x180" | "192x192" | "512x512"
): string | undefined {
  if (!kit.favicon) return undefined;

  if (typeof kit.favicon === "string") {
    return kit.favicon;
  }

  return kit.favicon.sizes?.[size] ?? kit.favicon.primary;
}

/**
 * Convert brand kit colors to CSS custom properties.
 */
export function brandKitToCssVars(kit: BrandKit): Record<string, string> {
  const vars: Record<string, string> = {};

  if (kit.colors) {
    if (kit.colors.primary) vars["--brand-primary"] = kit.colors.primary;
    if (kit.colors.secondary) vars["--brand-secondary"] = kit.colors.secondary;
    if (kit.colors.accent) vars["--brand-accent"] = kit.colors.accent;
    if (kit.colors.background) vars["--brand-background"] = kit.colors.background;
    if (kit.colors.text) vars["--brand-text"] = kit.colors.text;
    if (kit.colors.success) vars["--brand-success"] = kit.colors.success;
    if (kit.colors.error) vars["--brand-error"] = kit.colors.error;
    if (kit.colors.warning) vars["--brand-warning"] = kit.colors.warning;
  }

  return vars;
}

/**
 * Merge brand kit with theme defaults.
 * Brand kit values take precedence over theme defaults.
 */
export function mergeBrandKitWithTheme(
  kit: BrandKit,
  themeDefaults: Record<string, string>
): Record<string, string> {
  const brandVars = brandKitToCssVars(kit);

  return {
    ...themeDefaults,
    ...brandVars,
  };
}
