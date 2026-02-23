import { tokens as caryinaTokens } from "./tokens";

export const tokens: Record<string, string> = Object.fromEntries(
  Object.entries(caryinaTokens).map(([k, v]) => [k, typeof v === "string" ? v : v.light])
);
