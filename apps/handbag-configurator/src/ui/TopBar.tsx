"use client";

import { Switch } from "@acme/design-system/atoms";
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

  return (
    <header className="sticky top-0 z-40 border-b border-border-1 bg-surface-2">
      <div className="mx-auto grid h-14 w-full max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center px-6 text-foreground">
        <div className="flex items-center gap-3">
          <ThemeToggle className="scale-90 opacity-80" />
        </div>

        <div className="text-center text-sm font-semibold tracking-[0.24em] text-foreground/80">
          {productName}
        </div>

        <div className="flex items-center justify-end gap-6 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <Switch
              checked={hotspotConfigMode}
              onChange={(event) => setHotspotConfigMode(event.target.checked)}
              aria-label="Toggle hotspot config mode"
              className="scale-90"
            />
            <span className="text-[11px] uppercase tracking-[0.3em]">Hotspots</span>
          </label>
          <label className="flex items-center gap-2">
            <Switch
              checked={basicMode}
              onChange={(event) => setBasicMode(event.target.checked)}
              aria-label="Toggle basic mode"
              className="scale-90"
            />
            <span className="text-[11px] uppercase tracking-[0.3em]">Basic</span>
          </label>
          <label className="flex items-center gap-2">
            <Switch
              checked={bagOpen}
              onChange={(event) => setBagOpen(event.target.checked)}
              aria-label="Toggle bag open state"
              className="scale-90"
            />
            <span className="text-[11px] uppercase tracking-[0.3em]">Opened</span>
          </label>
        </div>
      </div>
    </header>
  );
}
