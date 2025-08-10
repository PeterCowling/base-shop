export const themeInitScript = `
(function () {
  var theme = localStorage.getItem('theme') || 'system';
  var classList = document.documentElement.classList;
  if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      classList.add('theme-dark');
    } else {
      classList.remove('theme-dark');
    }
  } else if (theme === 'dark') {
    classList.add('theme-dark');
  } else {
    classList.remove('theme-dark');
  }
  if (theme === 'brandx') {
    classList.add('theme-brandx');
  } else {
    classList.remove('theme-brandx');
  }
})();
`;
