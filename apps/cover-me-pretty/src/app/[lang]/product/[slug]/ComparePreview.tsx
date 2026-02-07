"use client";
import { useState } from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";

export function ComparePreview({ baseUrl, enhancedUrl }: { baseUrl: string; enhancedUrl: string }) {
  const [split, setSplit] = useState(50);
  const t = useTranslations();
  return (
    <div className="relative h-40 w-64 select-none overflow-hidden rounded border">
      <Image
        src={baseUrl}
        alt={t("tryon.alt.original")}
        fill
        className="object-cover"
        sizes="256px"
      />
      <Image
        src={enhancedUrl}
        alt={t("tryon.alt.enhanced")}
        fill
        className="object-cover"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        sizes="256px"
      />
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        className="absolute bottom-1 inset-x-1"
        aria-label={t("tryon.control.compare")}
      />
    </div>
  );
}
