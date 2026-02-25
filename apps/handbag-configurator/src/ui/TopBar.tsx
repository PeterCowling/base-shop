"use client";

import { Switch } from "@acme/design-system/atoms";
import { type ThemeOption,ThemeToggle } from "@acme/design-system/atoms/ThemeToggle";
import { useTranslations } from "@acme/i18n/Translations";
import { useThemeMode } from "@acme/platform-core/contexts/ThemeModeContext";

import { useModeStore } from "../viewer/state/modeStore";

type TopBarProps = {
  productName: string;
};

export function TopBar({ productName }: TopBarProps) {
  const basicMode = useModeStore((state) => state.basicMode);
  const bagOpen = useModeStore((state) => state.bagOpen);
  const hotspotConfigMode = useModeStore((state) => state.hotspotConfigMode);
  const setBasicMode = useModeStore((state) => state.setBasicMode);
  const setBagOpen = useModeStore((state) => state.setBagOpen);
  const setHotspotConfigMode = useModeStore((state) => state.setHotspotConfigMode);
  const t = useTranslations();
  const { mode, setMode } = useThemeMode();

  const themeValue: ThemeOption =
    mode === "light" ? "base" : mode === "dark" ? "dark" : "system";

  const handleThemeChange = (next: ThemeOption) => {
    setMode(next === "base" ? "light" : next);
  };

  return (
    <header className="handbag-topbar sticky top-0 border-b border-border-1 bg-surface-2">
      <div className="handbag-topbar-inner handbag-topbar-grid h-14 items-center px-6 text-foreground">
        <div className="flex items-center gap-3">
          <ThemeToggle
            theme={themeValue}
            onThemeChange={handleThemeChange}
            size="sm"
          />
        </div>

        <div className="hidden text-center text-sm font-semibold handbag-tracking-title text-foreground/80 sm:block">
          {productName}
        </div>

        <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground sm:gap-6">
          <label className="flex items-center gap-2">
            <Switch
              checked={hotspotConfigMode}
              onChange={(event) => setHotspotConfigMode(event.target.checked)}
              aria-label={t("handbagConfigurator.controls.toggleHotspots")}
              className="scale-90"
            />
            <span className="hidden text-xs uppercase handbag-tracking-label sm:inline">
              {t("handbagConfigurator.controls.hotspots")}
            </span>
          </label>
          <label className="flex items-center gap-2">
            <Switch
              checked={basicMode}
              onChange={(event) => setBasicMode(event.target.checked)}
              aria-label={t("handbagConfigurator.controls.toggleBasic")}
              className="scale-90"
            />
            <span className="hidden text-xs uppercase handbag-tracking-label sm:inline">
              {t("handbagConfigurator.controls.basic")}
            </span>
          </label>
          <label className="flex items-center gap-2">
            <Switch
              checked={bagOpen}
              onChange={(event) => setBagOpen(event.target.checked)}
              aria-label={t("handbagConfigurator.controls.toggleBagOpen")}
              className="scale-90"
            />
            <span className="hidden text-xs uppercase handbag-tracking-label sm:inline">
              {t("handbagConfigurator.controls.opened")}
            </span>
          </label>
        </div>
      </div>
    </header>
  );
}
