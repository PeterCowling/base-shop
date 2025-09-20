import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

export function cssVars(overrides?: StyleOverrides): Record<string, string> {
  if (!overrides) return {};
  const vars: Record<string, string> = {};
  if (overrides.color) {
    if (overrides.color.bg)
      vars["--color-bg"] = `var(${overrides.color.bg})`;
    if (overrides.color.fg)
      vars["--color-fg"] = `var(${overrides.color.fg})`;
    if (overrides.color.border)
      vars["--color-border"] = `var(${overrides.color.border})`;
  }
  if (overrides.typography) {
    if (overrides.typography.fontFamily)
      vars["--font-family"] = `var(${overrides.typography.fontFamily})`;
    if (overrides.typography.fontSize)
      vars["--font-size"] = `var(${overrides.typography.fontSize})`;
    if (overrides.typography.fontWeight)
      vars["--font-weight"] = `var(${overrides.typography.fontWeight})`;
    if (overrides.typography.lineHeight)
      vars["--line-height"] = `var(${overrides.typography.lineHeight})`;
  }
  // Per-breakpoint typography variants. These are mapped via builder.css
  if (overrides.typographyDesktop) {
    if (overrides.typographyDesktop.fontSize)
      vars["--font-size-desktop"] = `var(${overrides.typographyDesktop.fontSize})`;
    if (overrides.typographyDesktop.lineHeight)
      vars["--line-height-desktop"] = `var(${overrides.typographyDesktop.lineHeight})`;
  }
  if (overrides.typographyTablet) {
    if (overrides.typographyTablet.fontSize)
      vars["--font-size-tablet"] = `var(${overrides.typographyTablet.fontSize})`;
    if (overrides.typographyTablet.lineHeight)
      vars["--line-height-tablet"] = `var(${overrides.typographyTablet.lineHeight})`;
  }
  if (overrides.typographyMobile) {
    if (overrides.typographyMobile.fontSize)
      vars["--font-size-mobile"] = `var(${overrides.typographyMobile.fontSize})`;
    if (overrides.typographyMobile.lineHeight)
      vars["--line-height-mobile"] = `var(${overrides.typographyMobile.lineHeight})`;
  }
  // Effects: we return direct CSS properties where appropriate.
  if (overrides.effects) {
    const fx = overrides.effects;
    if (fx.borderRadius) vars["borderRadius"] = fx.borderRadius;
    if (fx.boxShadow) vars["boxShadow"] = fx.boxShadow;
    if (fx.opacity) vars["opacity"] = fx.opacity;
    if (fx.backdropFilter) vars["backdropFilter"] = fx.backdropFilter;
    if (fx.outline) vars["outline"] = fx.outline;
    if (fx.outlineOffset) vars["outlineOffset"] = fx.outlineOffset;
    if (fx.borderTop) vars["borderTop"] = fx.borderTop;
    if (fx.borderRight) vars["borderRight"] = fx.borderRight;
    if (fx.borderBottom) vars["borderBottom"] = fx.borderBottom;
    if (fx.borderLeft) vars["borderLeft"] = fx.borderLeft;
    // Compose transform into a custom var which can be applied by wrappers
    const parts: string[] = [];
    if (fx.transformRotate) parts.push(`rotate(${fx.transformRotate})`);
    if (fx.transformScale) parts.push(`scale(${fx.transformScale})`);
    if (fx.transformSkewX) parts.push(`skewX(${fx.transformSkewX})`);
    if (fx.transformSkewY) parts.push(`skewY(${fx.transformSkewY})`);
    if (parts.length) vars["--pb-static-transform"] = parts.join(" ");
  }
  return vars;
}
