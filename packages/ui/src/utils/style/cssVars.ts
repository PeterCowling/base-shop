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
  return vars;
}
