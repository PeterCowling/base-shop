// Copied from src/components/header/ThemeToggle.tsx
import { useTheme } from "@ui/hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import { memo, useCallback } from "react";
import { useTranslations } from "@acme/i18n";

export const ThemeToggle = memo((): JSX.Element => {
  const { theme, setTheme } = useTheme();
  const t = useTranslations();
  const isLight = theme === "light";
  const next = useCallback(() => setTheme(theme === "light" ? "dark" : "light"), [theme, setTheme]);
  const title = isLight ? t("themeToggle.switchToDark") : t("themeToggle.switchToLight");
  const ariaLabel = isLight ? t("themeToggle.enableDark") : t("themeToggle.enableLight");
  return (
    <button
      type="button"
      onClick={next}
      title={title}
      aria-label={ariaLabel}
      className="btn-square-12 size-12 rounded-md border border-gray-200 transition dark:border-gray-700"
    >
      {isLight ? (
        <Sun className="size-5" style={{ color: "var(--color-brand-secondary)" }} aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  );
});
ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;
