/**
 * Theme Expression Types
 *
 * Three-layer creative expressiveness system:
 * Layer 1: Theme Assets — what the brand has
 * Layer 2: Design Profile — how the brand uses its tools
 * Layer 3: Recipes — reusable branded surface compositions
 */

// ═══════════════════════════════════════════
// Utility types
// ═══════════════════════════════════════════

/** Recursively make all properties optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ═══════════════════════════════════════════
// Layer 1: Theme Assets
// ═══════════════════════════════════════════

export interface FontAsset {
  family: string;
  source: "local" | "google";
  weights: number[];
  variableFont?: boolean;
}

export interface GradientStop {
  color: string;
  position: string;
}

export interface GradientAsset {
  type: "linear" | "radial" | "conic";
  angle?: number;
  stops: GradientStop[];
}

export interface KeyframeStep {
  [property: string]: string;
}

export interface KeyframeAsset {
  from: KeyframeStep;
  to: KeyframeStep;
}

export interface BrandColor {
  light: string;
  dark?: string;
}

export interface ThemeAssets {
  fonts: Record<string, FontAsset>;
  gradients: Record<string, GradientAsset>;
  shadows: Record<string, string>;
  keyframes: Record<string, KeyframeAsset>;
  brandColors: Record<string, BrandColor | string>;
}

// ═══════════════════════════════════════════
// Layer 2: Design Profile
// ═══════════════════════════════════════════

// Category B enum types
export type Radius = "none" | "sm" | "md" | "lg" | "xl";
export type Elevation = "flat" | "subtle" | "moderate" | "layered";
export type Border = "none" | "subtle" | "defined" | "bold";
export type ButtonTone = "solid" | "soft" | "outline" | "ghost";
export type InputStyle = "outlined" | "filled" | "underlined";
export type TableStyle = "minimal" | "striped" | "bordered";

// Category C enum types
export type ColorStrategy = "monochromatic" | "restrained" | "expressive" | "bold";
export type AccentUsage = "spot" | "structural" | "pervasive";
export type Whitespace = "dense" | "balanced" | "generous" | "extreme";
export type GridCharacter = "symmetric" | "asymmetric" | "single-column";
export type ImageRelationship = "full-bleed" | "contained" | "overlapping";
export type MotionPersonality = "playful" | "precise" | "dramatic" | "none";
export type DisplayTransform = "none" | "uppercase";

export type SurfaceMode = "marketing" | "editorial" | "operations" | "campaign";

// Category A: compile-time variables
export interface TypographyProfile {
  scaleRatio: number;
  bodySize: string;
  bodyLeading: number;
  bodyMeasure: string;
  displayWeight: number;
  labelTracking: string;
}

export interface MotionProfile {
  durationFast: string;
  durationNormal: string;
  durationSlow: string;
  easing: string;
}

export interface SpaceProfile {
  sectionGap: string;
  componentGap: string;
  contentMaxWidth: string;
  cardPadding: string;
}

// Category B: enum-to-token mappings
export interface SurfaceProfile {
  defaultRadius: Radius;
  defaultElevation: Elevation;
  defaultBorder: Border;
}

export interface ComponentsProfile {
  buttonTone: ButtonTone;
  inputStyle: InputStyle;
  tableStyle: TableStyle;
}

// Category C: agent-only guidance
export interface GuidanceProfile {
  colorStrategy: ColorStrategy;
  accentUsage: AccentUsage;
  whitespace: Whitespace;
  gridCharacter: GridCharacter;
  imageRelationship: ImageRelationship;
  motionPersonality: MotionPersonality;
  displayTransform: DisplayTransform;
}

export interface DesignProfile {
  // Category A
  typography: TypographyProfile;
  motion: MotionProfile;
  space: SpaceProfile;
  // Category B
  surface: SurfaceProfile;
  components: ComponentsProfile;
  // Category C
  guidance: GuidanceProfile;
  // Surface modes (partial overrides of baseline)
  modes?: Partial<Record<SurfaceMode, DeepPartial<Omit<DesignProfile, "modes">>>>;
}

// ═══════════════════════════════════════════
// Layer 3: Recipes
// ═══════════════════════════════════════════

export interface RecipeBase {
  classes: string;
  css?: Record<string, string>;
  hover?: string;
}

export interface ThemeRecipe {
  description: string;
  applicableModes: SurfaceMode[];
  base: RecipeBase;
  variants?: Record<string, Partial<RecipeBase>>;
  responsive?: Record<string, Partial<RecipeBase>>;
  usage: string;
  doNotUseWhen?: string;
}

export type ThemeRecipes = Record<string, ThemeRecipe>;
