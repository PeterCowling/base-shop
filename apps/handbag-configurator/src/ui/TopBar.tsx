"use client";

import { Switch } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";

import { useModeStore } from "../viewer/state/modeStore";

import { ThemeToggle } from "./ThemeToggle";

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

  return (
    <header className="sticky top-0 handbag-topbar border-b border-border-1 bg-surface-2">
      <div className="handbag-topbar-inner handbag-topbar-grid h-14 items-center px-6 text-foreground">
          <div className="flex items-center gap-3">
            <div className="scale-90 opacity-80">
              <ThemeToggle />
            </div>
          </div>

        <div className="text-center text-sm font-semibold handbag-tracking-title text-foreground/80">
          {productName}
        </div>

        <div className="flex items-center justify-end gap-6 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <Switch
              checked={hotspotConfigMode}
              onChange={(event) => setHotspotConfigMode(event.target.checked)}
              aria-label={t("handbagConfigurator.controls.toggleHotspots")}
              className="scale-90"
            />
            <span className="text-xs uppercase handbag-tracking-label">
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
            <span className="text-xs uppercase handbag-tracking-label">
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
            <span className="text-xs uppercase handbag-tracking-label">
              {t("handbagConfigurator.controls.opened")}
            </span>
          </label>
        </div>
      </div>
    </header>
  );
}
