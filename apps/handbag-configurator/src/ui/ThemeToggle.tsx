"use client";

import { useTranslations } from "@acme/i18n";
import { useThemeMode } from "@acme/platform-core/contexts/ThemeModeContext";

export function ThemeToggle() {
  const { isDark, setMode } = useThemeMode();
  const t = useTranslations();

  const toggleTheme = () => {
    setMode(isDark ? "light" : "dark");
  };

  const themeSwitchLabel = isDark
    ? t("handbagConfigurator.theme.switchToLight")
    : t("handbagConfigurator.theme.switchToDark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={themeSwitchLabel}
      title={themeSwitchLabel}
      className="relative inline-flex min-h-11 min-w-11 items-center rounded-full border border-border-2 bg-surface-2 px-1 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="sr-only">{t("handbagConfigurator.theme.toggle")}</span>
      <span className="pointer-events-none absolute start-2 uppercase handbag-caption handbag-tracking-tight text-muted-foreground">
        L
      </span>
      <span className="pointer-events-none absolute end-2 uppercase handbag-caption handbag-tracking-tight text-muted-foreground">
        D
      </span>
      <span
        className={`absolute start-1 top-1 h-6 w-6 rounded-full bg-foreground shadow transition-transform duration-200 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}
