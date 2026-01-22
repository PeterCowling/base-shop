// Copied from src/components/header/ThemeToggle.tsx
import { memo, useCallback } from "react";
import { Moon, Sun } from "lucide-react";

import { useTranslations } from "@acme/i18n";

import { useTheme } from "../hooks/useTheme";

export const ThemeToggle = memo((): JSX.Element => {
  const { setTheme, isDark } = useTheme();
  const t = useTranslations();
  const next = useCallback(() => setTheme(isDark ? "light" : "dark"), [isDark, setTheme]);
  const title = isDark ? t("themeToggle.switchToLight") : t("themeToggle.switchToDark");
  const ariaLabel = isDark ? t("themeToggle.enableLight") : t("themeToggle.enableDark");
  return (
    <button
      type="button"
      onClick={next}
      title={title}
      aria-label={ariaLabel}
      className="btn-square-12 size-12 rounded-md border border-gray-200 transition dark:border-gray-700"
    >
      {!isDark ? (
        <Sun className="size-5" style={{ color: "var(--color-brand-secondary)" }} aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  );
});
ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;
