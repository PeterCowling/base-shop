export interface CssVarInput {
  [key: string]: string | undefined;
}

export function cssVars(overrides: CssVarInput): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) continue;
    const cssKey = `--${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
    result[cssKey] = value.startsWith("token.")
      ? `var(--${value.replace(/\./g, "-")})`
      : value;
  }
  return result;
}

export default cssVars;
