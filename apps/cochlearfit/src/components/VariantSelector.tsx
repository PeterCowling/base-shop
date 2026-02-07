"use client";

import React, { useCallback, useMemo } from "react";

import { useTranslations } from "@acme/i18n";

import Inline from "@/components/layout/Inline";
import { getColorHex } from "@/lib/catalog";
import type { ProductColor, ProductSize } from "@/types/product";

type VariantSelectorProps = {
  sizes: ProductSize[];
  colors: ProductColor[];
  size: ProductSize;
  color: ProductColor;
  onSizeChange: (size: ProductSize) => void;
  onColorChange: (color: ProductColor) => void;
};

type SizeButtonProps = {
  value: ProductSize;
  label: string;
  selected: boolean;
  onSelect: (value: ProductSize) => void;
};

type ColorButtonProps = {
  value: ProductColor;
  label: string;
  hex: string;
  selected: boolean;
  onSelect: (value: ProductColor) => void;
};

const SizeButton = React.memo(function SizeButton({
  value,
  label,
  selected,
  onSelect,
}: SizeButtonProps) {
  const handleClick = useCallback(() => {
    onSelect(value);
  }, [onSelect, value]);
  const selectedClasses = [
    "rounded-full",
    "border",
    "border-primary",
    "bg-primary/10",
    "px-4",
    "py-2",
    "text-sm",
    "font-semibold",
    "text-accent",
  ];
  const unselectedClasses = [
    "rounded-full",
    "border",
    "border-border-1",
    "px-4",
    "py-2",
    "text-sm",
    "font-semibold",
    "text-foreground",
    "transition",
    "hover:border-primary/60",
  ];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={(selected ? selectedClasses : unselectedClasses).join(" ")}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
});

const ColorButton = React.memo(function ColorButton({
  value,
  label,
  hex,
  selected,
  onSelect,
}: ColorButtonProps) {
  const handleClick = useCallback(() => {
    onSelect(value);
  }, [onSelect, value]);

  const swatchStyle = useMemo(() => ({ backgroundColor: hex }), [hex]);
  const selectedClasses = [
    "flex",
    "items-center",
    "gap-2",
    "rounded-full",
    "border",
    "border-primary",
    "bg-surface-2",
    "px-3",
    "py-2",
    "text-sm",
    "font-semibold",
    "text-foreground",
  ];
  const unselectedClasses = [
    "flex",
    "items-center",
    "gap-2",
    "rounded-full",
    "border",
    "border-border-1",
    "bg-surface-2",
    "px-3",
    "py-2",
    "text-sm",
    "font-semibold",
    "text-foreground",
    "transition",
    "hover:border-primary/60",
  ];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={(selected ? selectedClasses : unselectedClasses).join(" ")}
      aria-pressed={selected}
    >
      <span
        className="h-4 w-4 rounded-full border border-border-1"
        style={swatchStyle}
        aria-hidden
      />
      {label}
    </button>
  );
});

export default function VariantSelector({
  sizes,
  colors,
  size,
  color,
  onSizeChange,
  onColorChange,
}: VariantSelectorProps) {
  const t = useTranslations();
  const sizeOptions = useMemo(() => sizes, [sizes]);
  const colorOptions = useMemo(() => colors, [colors]);
  const selectedColorLabel = useMemo(
    () => t(`color.${color}`) as string,
    [color, t]
  );
  const selectedColorVars = useMemo(
    () => ({ color: selectedColorLabel }),
    [selectedColorLabel]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("product.size") as string}
        </div>
        <Inline className="flex-wrap gap-2">
          {sizeOptions.map((option) => (
            <SizeButton
              key={option}
              value={option}
              label={t(`size.${option}`) as string}
              selected={option === size}
              onSelect={onSizeChange}
            />
          ))}
        </Inline>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("product.color") as string}
        </div>
        <Inline className="flex-wrap gap-2">
          {colorOptions.map((option) => (
            <ColorButton
              key={option}
              value={option}
              label={t(`color.${option}`) as string}
              hex={getColorHex(option)}
              selected={option === color}
              onSelect={onColorChange}
            />
          ))}
        </Inline>
      </div>
      <div className="text-sm text-muted-foreground">
        {t("product.selectedColor", selectedColorVars) as string}
      </div>
    </div>
  );
}
