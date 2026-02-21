import { tokens as primeTokens } from "./tokens";

export const tokens: Record<string, string> = Object.fromEntries(
  Object.entries(primeTokens).map(([k, v]) => [k, typeof v === "string" ? v : v.light])
);
