import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

function setCssVar(vars: Record<string, string>, name: string, token?: string): void {
  if (!token) return;
  vars[name] = `var(${token})`;
}

function applyColors(vars: Record<string, string>, color?: StyleOverrides["color"]): void {
  if (!color) return;
  setCssVar(vars, "--color-bg", color.bg);
  setCssVar(vars, "--color-fg", color.fg);
  setCssVar(vars, "--color-border", color.border);
}

function applyTypography(
  vars: Record<string, string>,
  typography?: StyleOverrides["typography"],
): void {
  if (!typography) return;
  setCssVar(vars, "--font-family", typography.fontFamily);
  setCssVar(vars, "--font-size", typography.fontSize);
  setCssVar(vars, "--font-weight", typography.fontWeight);
  setCssVar(vars, "--line-height", typography.lineHeight);
}

function applyTypographyVariant(
  vars: Record<string, string>,
  prefix: "desktop" | "tablet" | "mobile",
  typography?: { fontSize?: string; lineHeight?: string },
): void {
  if (!typography) return;
  setCssVar(vars, `--font-size-${prefix}`, typography.fontSize);
  setCssVar(vars, `--line-height-${prefix}`, typography.lineHeight);
}

function applyEffects(vars: Record<string, string>, effects?: StyleOverrides["effects"]): void {
  if (!effects) return;
  if (effects.borderRadius) vars.borderRadius = effects.borderRadius;
  if (effects.boxShadow) vars.boxShadow = effects.boxShadow;
  if (effects.opacity) vars.opacity = effects.opacity;
  if (effects.backdropFilter) vars.backdropFilter = effects.backdropFilter;
  const filterVal = (effects as unknown as { filter?: string }).filter;
  if (filterVal) vars.filter = filterVal;
  if (effects.outline) vars.outline = effects.outline;
  if (effects.outlineOffset) vars.outlineOffset = effects.outlineOffset;
  if (effects.borderTop) vars.borderTop = effects.borderTop;
  if (effects.borderRight) vars.borderRight = effects.borderRight;
  if (effects.borderBottom) vars.borderBottom = effects.borderBottom;
  if (effects.borderLeft) vars.borderLeft = effects.borderLeft;

  const transformParts: string[] = [];
  if (effects.transformRotate) transformParts.push(`rotate(${effects.transformRotate})`);
  if (effects.transformScale) transformParts.push(`scale(${effects.transformScale})`);
  if (effects.transformSkewX) transformParts.push(`skewX(${effects.transformSkewX})`);
  if (effects.transformSkewY) transformParts.push(`skewY(${effects.transformSkewY})`);
  if (transformParts.length) vars["--pb-static-transform"] = transformParts.join(" ");
}

export function cssVars(overrides?: StyleOverrides): Record<string, string> {
  if (!overrides) return {};
  const vars: Record<string, string> = {};
  applyColors(vars, overrides.color);
  applyTypography(vars, overrides.typography);
  applyTypographyVariant(vars, "desktop", overrides.typographyDesktop);
  applyTypographyVariant(vars, "tablet", overrides.typographyTablet);
  applyTypographyVariant(vars, "mobile", overrides.typographyMobile);
  applyEffects(vars, overrides.effects);
  return vars;
}
