// apps/cms/src/app/cms/shop/[shop]/themes/BrandIntensitySelector.tsx
"use client";
import type { ChangeEvent } from "react";
import type { BrandIntensity } from "./brandIntensity";
import { useTranslations } from "@i18n/Translations";

interface Props {
  value: BrandIntensity;
  onChange: (value: BrandIntensity) => void;
}

export default function BrandIntensitySelector({ value, onChange }: Props) {
  const t = useTranslations();
  const handle = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as BrandIntensity);
  };
  return (
    <label className="flex flex-col gap-1">
      <span>{t("cms.theme.brandIntensity.label")}</span>
      <select className="border p-2" value={value} onChange={handle}>
        <option value="Value">{t("cms.theme.brandIntensity.value")}</option>
        <option value="Everyday">{t("cms.theme.brandIntensity.everyday")}</option>
        <option value="Premium">{t("cms.theme.brandIntensity.premium")}</option>
        <option value="Luxury">{t("cms.theme.brandIntensity.luxury")}</option>
      </select>
    </label>
  );
}
