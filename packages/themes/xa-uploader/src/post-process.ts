/**
 * Post-processor for xa-uploader gate CSS output.
 *
 * `generateThemeCSS()` unconditionally emits:
 *   - `color-scheme: light;` in :root
 *   - `--theme-transition-duration: ...;` in :root
 *   - `.dark { color-scheme: dark; }` block
 *
 * xa-uploader's globals.css only needs the 17 `--gate-*` vars in :root.
 * This helper strips the compiler extras so the committed CSS is a clean
 * `:root { --gate-* }` block only.
 *
 * Used by:
 *   - scripts/xa-uploader/generate-theme-tokens.ts (production write)
 *   - packages/themes/xa-uploader/__tests__/generated-parity.test.ts (CI validation)
 */
export function postProcessGateCSS(rawCSS: string): string {
  let css = rawCSS;

  // Remove color-scheme declarations (both light and dark variants)
  css = css.replace(/^\s*color-scheme\s*:\s*\S+\s*;\s*\n/gm, "");

  // Remove --theme-transition-duration line
  css = css.replace(/^\s*--theme-transition-duration\s*:[^;]+;\s*\n/gm, "");

  // Remove the entire .dark { ... } block (non-greedy, handles single-line or multi-line)
  css = css.replace(/\.dark\s*\{[^}]*\}\s*\n?/gs, "");

  // Clean up any consecutive blank lines left by removal
  css = css.replace(/\n{3,}/g, "\n\n");

  return css.trim() + "\n";
}
