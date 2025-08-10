// packages/platform-core/src/utils/initTheme.ts

/**
 * Returns an inline script that initializes the document theme before React
 * hydration. It reads the persisted theme from localStorage (defaulting to
 * "system"), resolves the effective dark mode, toggles theme classes and sets
 * the document's color-scheme accordingly.
 */
export function initTheme(): string {
  return `(function () {
    var theme = localStorage.theme || 'system';
    var classList = document.documentElement.classList;
    var isDark = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark';
    classList[isDark ? 'add' : 'remove']('theme-dark');
    classList[theme === 'brandx' ? 'add' : 'remove']('theme-brandx');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  })();`;
}
