import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

function setCssVar(vars: Record<string, string>, name: string, token?: string) {
  if (!token) return;
  vars[name] = `var(${token})`;
}

function setStyleProp(vars: Record<string, string>, name: string, value?: string) {
  if (!value) return;
  vars[name] = value;
}

function applyEffects(vars: Record<string, string>, effects?: StyleOverrides["effects"]) {
  if (!effects) return;

  setStyleProp(vars, "borderRadius", effects.borderRadius);
  setStyleProp(vars, "boxShadow", effects.boxShadow);
  setStyleProp(vars, "opacity", effects.opacity);
  setStyleProp(vars, "backdropFilter", effects.backdropFilter);
  setStyleProp(vars, "outline", effects.outline);
  setStyleProp(vars, "outlineOffset", effects.outlineOffset);
  setStyleProp(vars, "borderTop", effects.borderTop);
  setStyleProp(vars, "borderRight", effects.borderRight);
  setStyleProp(vars, "borderBottom", effects.borderBottom);
  setStyleProp(vars, "borderLeft", effects.borderLeft);

  const filterValue = (effects as unknown as { filter?: string }).filter;
  setStyleProp(vars, "filter", filterValue);

  const transformParts: string[] = [];
  if (effects.transformRotate) transformParts.push(`rotate(${effects.transformRotate})`);
  if (effects.transformScale) transformParts.push(`scale(${effects.transformScale})`);
  if (effects.transformSkewX) transformParts.push(`skewX(${effects.transformSkewX})`);
  if (effects.transformSkewY) transformParts.push(`skewY(${effects.transformSkewY})`);
  if (transformParts.length > 0) {
    vars["--pb-static-transform"] = transformParts.join(" ");
  }
}

export function cssVars(overrides?: StyleOverrides): Record<string, string> {
  if (!overrides) return {};

  const vars: Record<string, string> = {};

  setCssVar(vars, "--color-bg", overrides.color?.bg);
  setCssVar(vars, "--color-fg", overrides.color?.fg);
  setCssVar(vars, "--color-border", overrides.color?.border);

  setCssVar(vars, "--font-family", overrides.typography?.fontFamily);
  setCssVar(vars, "--font-size", overrides.typography?.fontSize);
  setCssVar(vars, "--font-weight", overrides.typography?.fontWeight);
  setCssVar(vars, "--line-height", overrides.typography?.lineHeight);

  setCssVar(vars, "--font-size-desktop", overrides.typographyDesktop?.fontSize);
  setCssVar(vars, "--line-height-desktop", overrides.typographyDesktop?.lineHeight);

  setCssVar(vars, "--font-size-tablet", overrides.typographyTablet?.fontSize);
  setCssVar(vars, "--line-height-tablet", overrides.typographyTablet?.lineHeight);

  setCssVar(vars, "--font-size-mobile", overrides.typographyMobile?.fontSize);
  setCssVar(vars, "--line-height-mobile", overrides.typographyMobile?.lineHeight);

  applyEffects(vars, overrides.effects);

  return vars;
}
