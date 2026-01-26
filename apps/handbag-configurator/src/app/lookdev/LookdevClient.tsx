"use client";

import { useEffect } from "react";

import { useTranslations } from "@acme/i18n";

import { useModeStore } from "../../viewer/state/modeStore";
import { ViewerCanvas } from "../../viewer/ViewerCanvas";

export function LookdevClient() {
  const setMode = useModeStore((state) => state.setMode);
  const t = useTranslations();

  useEffect(() => {
    setMode("showroom");
  }, [setMode]);

  return (
    <div className="handbag-shell flex min-h-dvh flex-col">
      <header className="border-b border-border-1 px-6 py-4">
        <p className="text-xs uppercase handbag-tracking-label text-muted-foreground">
          {t("handbagConfigurator.lookdev.label")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {t("handbagConfigurator.lookdev.title")}
        </h1>
      </header>
      <div className="relative flex-1">
        <ViewerCanvas productId="bag-001" showLookdevObjects />
        <div className="pointer-events-none absolute end-6 top-6 handbag-floating-note rounded-2xl border border-border-1 bg-panel/85 p-4 text-xs text-muted-foreground">
          {t("handbagConfigurator.lookdev.description")}
        </div>
      </div>
    </div>
  );
}
