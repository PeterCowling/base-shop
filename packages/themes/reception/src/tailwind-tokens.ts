import { tokens as receptionTokens } from "./tokens";

export const tokens: Record<string, string> = Object.fromEntries(
  Object.entries(receptionTokens).flatMap(([k, v]) => {
    if (typeof v === "string") return [[k, v]];
    const entries: [string, string][] = [[k, v.light]];
    if (v.dark) entries.push([`${k}-dark`, v.dark]);
    return entries;
  })
);
