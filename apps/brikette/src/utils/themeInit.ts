// /src/utils/themeInit.ts
/**
 * Returns a small, self-invoking script string that runs **before** React
 * hydrates, ensuring the correct colour-scheme class is set on
 * <html>.  Kept minified-enough to avoid whitespace issues in tests.
 */
export const getThemeInitScript = (): string =>
  `(function () {
    var KEY="theme";
    var stored=localStorage.getItem(KEY);
    var fallback="light";
    try {
      fallback=typeof window.matchMedia==="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
    } catch (_) {
      fallback="light";
    }
    var theme=stored||fallback;
    document.documentElement.classList.toggle("theme-dark",theme==="dark");
  })();`;
