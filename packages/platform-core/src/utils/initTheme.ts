export const initTheme = `
(function () {
  var theme = 'system';
  try {
    theme = localStorage.getItem('theme') || 'system';
  } catch (e) {}
  var classList = document.documentElement.classList;
  var isDark = theme === 'dark';
  if (theme === 'system') {
    try {
      isDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      isDark = false;
    }
  }
  if (isDark) {
    classList.add('theme-dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    classList.remove('theme-dark');
    document.documentElement.style.colorScheme = 'light';
  }
  if (theme === 'brandx') {
    classList.add('theme-brandx');
  } else {
    classList.remove('theme-brandx');
  }
})();
`;
