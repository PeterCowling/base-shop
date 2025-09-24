// apps/cms/src/app/cms/shop/[shop]/themes/BrandIntensitySelector.tsx
"use client";
import type { ChangeEvent } from "react";
import type { BrandIntensity } from "./brandIntensity";

interface Props {
  value: BrandIntensity;
  onChange: (value: BrandIntensity) => void;
}

export default function BrandIntensitySelector({ value, onChange }: Props) {
  const handle = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as BrandIntensity);
  };
  return (
    <label className="flex flex-col gap-1">
      <span>Brand intensity</span>
      <select className="border p-2" value={value} onChange={handle}>
        <option value="Value">Value</option>
        <option value="Everyday">Everyday</option>
        <option value="Premium">Premium</option>
        <option value="Luxury">Luxury</option>
      </select>
    </label>
  );
}

