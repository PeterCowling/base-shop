"use client";
import { useState } from "react";
import { useTranslations } from "@acme/i18n";

export function ComparePreview({ baseUrl, enhancedUrl }: { baseUrl: string; enhancedUrl: string }) {
  const [split, setSplit] = useState(50);
  const t = useTranslations();
  return (
    <div className="relative h-40 w-64 select-none overflow-hidden rounded border">
      <img src={baseUrl} alt={t("tryon.alt.original")} className="absolute left-0 top-0 h-full w-full object-cover" />
      <img
        src={enhancedUrl}
        alt={t("tryon.alt.enhanced")}
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        className="absolute left-0 top-0 h-full w-full object-cover"
      />
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        className="absolute bottom-1 left-1 right-1"
        aria-label={t("tryon.control.compare")}
      />
    </div>
  );
}
