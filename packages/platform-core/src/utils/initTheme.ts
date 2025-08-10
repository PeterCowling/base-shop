export const initTheme = `
(function () {
  var theme = localStorage.getItem('theme') || 'system';
  var classList = document.documentElement.classList;
  var isDark = theme === 'dark';
  if (theme === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
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
