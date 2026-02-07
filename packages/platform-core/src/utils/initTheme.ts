export const initTheme = `
(function () {
  var mode = 'system';
  var name = 'base';
  var namePattern = /^[a-z0-9-]+$/;
  try {
    var storedMode = localStorage.getItem('theme-mode');
    var storedName = localStorage.getItem('theme-name');
    if (storedMode) mode = storedMode;
    if (storedName && namePattern.test(storedName)) name = storedName;
    var legacy = localStorage.getItem('theme');
    if (legacy) {
      if (!storedMode) {
        if (legacy === 'dark' || legacy === 'system' || legacy === 'light' || legacy === 'base') {
          mode = legacy === 'base' ? 'light' : legacy;
        } else if (legacy === 'brandx') {
          mode = 'light';
        }
      }
      if (!storedName) {
        if (legacy === 'brandx') name = 'brandx';
        if (legacy === 'base') name = 'base';
      }
    }
  } catch (e) {}
  var classList = document.documentElement.classList;
  var isDark = mode === 'dark';
  if (mode === 'system') {
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
    classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    classList.remove('theme-dark');
    classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
  try {
    classList.forEach(function (cls) {
      if (cls.indexOf('theme-') === 0 && cls !== 'theme-dark') {
        classList.remove(cls);
      }
    });
  } catch (e) {}
  if (name !== 'base') {
    classList.add('theme-' + name);
  }
  try {
    document.documentElement.setAttribute('data-theme', name);
  } catch (e) {}
})();
`;
