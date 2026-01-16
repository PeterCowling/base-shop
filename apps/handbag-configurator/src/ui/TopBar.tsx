"use client";

import { useTranslations } from "@acme/i18n";
import { Switch } from "@acme/ui/atoms";
import { useModeStore } from "../viewer/state/modeStore";
import { ThemeToggle } from "./ThemeToggle";

type TopBarProps = {
  productName: string;
};

export function TopBar({ productName }: TopBarProps) {
  const t = useTranslations();
  const basicMode = useModeStore((state) => state.basicMode);
  const bagOpen = useModeStore((state) => state.bagOpen);
  const hotspotConfigMode = useModeStore((state) => state.hotspotConfigMode);
  const setBasicMode = useModeStore((state) => state.setBasicMode);
  const setBagOpen = useModeStore((state) => state.setBagOpen);
  const setHotspotConfigMode = useModeStore((state) => state.setHotspotConfigMode);

  return (
    <div className="relative">
      <header className="sticky top-0 border-b border-border-1 bg-surface-2">
        <div className="grid h-14 w-full grid-cols-3 items-center px-6 text-foreground">
          <div className="flex items-center gap-3">
            <ThemeToggle className="scale-90 opacity-80" />
          </div>

          <div className="text-center text-sm font-semibold tracking-widest text-foreground/80">
            {productName}
          </div>

          <div className="flex items-center justify-end gap-6 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              <Switch
                checked={hotspotConfigMode}
                onChange={(event) => setHotspotConfigMode(event.target.checked)}
                aria-label={t("handbag.topbar.toggleHotspotConfig")}
                className="scale-90"
              />
              <span className="text-xs uppercase tracking-widest">
                {t("handbag.topbar.hotspots")}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={basicMode}
                onChange={(event) => setBasicMode(event.target.checked)}
                aria-label={t("handbag.topbar.toggleBasicMode")}
                className="scale-90"
              />
              <span className="text-xs uppercase tracking-widest">
                {t("handbag.topbar.basic")}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={bagOpen}
                onChange={(event) => setBagOpen(event.target.checked)}
                aria-label={t("handbag.topbar.toggleBagOpen")}
                className="scale-90"
              />
              <span className="text-xs uppercase tracking-widest">
                {t("handbag.topbar.opened")}
              </span>
            </label>
          </div>
        </div>
      </header>
    </div>
  );
}
