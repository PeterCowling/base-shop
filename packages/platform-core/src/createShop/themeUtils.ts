import { baseTokens, loadThemeTokensNode } from "../themeTokens";

/**
 * Load the base Tailwind token mappings.
 *
 * The base theme defines tokens with optional dark variants. For the
 * create-shop script we only need the light values.
 */
export function loadBaseTokens(): Record<string, string> {
  return baseTokens as unknown as Record<string, string>;
}

/** Load theme tokens combined with base tokens. */
export function loadTokens(theme: string): Record<string, string> {
  return { ...loadBaseTokens(), ...loadThemeTokensNode(theme) };
}
