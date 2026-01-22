// /src/utils/themeInit.ts
/**
 * Returns a small, self-invoking script string that runs **before** React
 * hydrates, ensuring the correct colour-scheme class is set on
 * <html>.  Kept minified-enough to avoid whitespace issues in tests.
 */
export const getThemeInitScript = (): string =>
  `(function () {
    var KEY="theme";
    var theme="system";
    try {
      theme=localStorage.getItem(KEY)||"system";
    } catch (_) {}
    var isDark=theme==="dark";
    if(theme==="system"){
      try{
        isDark=typeof window.matchMedia==="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches;
      }catch(_){isDark=false;}
    }
    document.documentElement.classList.toggle("theme-dark",isDark);
    document.documentElement.classList.toggle("dark",isDark);
    try{document.documentElement.style.colorScheme=isDark?"dark":"light";}catch(_){}
  })();`;
