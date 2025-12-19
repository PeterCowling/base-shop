// packages/design-tokens/src/exportedTokenMap.ts
// Map of design token CSS variables to their corresponding `var(--token)` value.
//
// The map should stay in sync with the token definitions in
// `packages/themes/base/src/tokens.ts`. Each key is a CSS variable name and the
// value references the variable using the standard `var(--token)` syntax.

import { tokens } from "@themes/base";

const tokenKeys = Object.keys(tokens) as Array<keyof typeof tokens>;

export const exportedTokenMap = Object.fromEntries(
  tokenKeys.map((token) => [token, `var(${token as string})`])
) as { [K in keyof typeof tokens]: `var(${K & string})` };

export type ExportedTokenMap = typeof exportedTokenMap;
