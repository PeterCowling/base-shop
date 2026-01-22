"use client";
 

import { memo, useCallback, useMemo,useState } from "react";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Popover, PopoverContent, PopoverTrigger, Tooltip } from "@acme/design-system/atoms";

import useThemeSignature from "./hooks/useThemeSignature";
import type { PaletteItemProps } from "./palette.types";
import { defaultIcon } from "./paletteData";
import { getPaletteGlyph } from "./paletteIcons";
import { getPalettePreview } from "./previewImages";

const PaletteItem = memo(function PaletteItem({
  type,
  label,
  icon,
  description,
  previewImage,
  onAdd,
}: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: type,
      data: { from: "palette", type },
    });
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onAdd(type, label);
      }
    },
    [onAdd, type, label],
  );

  const glyph = getPaletteGlyph(type);

  const themeSig = useThemeSignature(["--color-bg", "--color-fg"]);

  const finalPreview = useMemo(() => {
    const isData = typeof previewImage === "string" && previewImage.startsWith("data:");
    const isDefault = previewImage === defaultIcon;
    if (isData || isDefault) {
      // Re-generate on theme changes to keep previews in sync
      void themeSig; // dependency
      return getPalettePreview(type);
    }
    return previewImage;
     
  }, [previewImage, type, themeSig]);

  const content = (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      data-cy={`pb-palette-item-${type}`}
      aria-pressed={isDragging}
      aria-describedby="pb-drag-instructions"
      title="Drag or press space/enter to add"
      style={{ transform: CSS.Transform.toString(transform) }}
      className="flex cursor-grab items-center gap-2 rounded border p-2 text-sm"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={handleKeyDown}
    >
      {/* Prefer Radix glyphs; fall back to provided image asset if any */}
      {glyph ? (
        <span aria-hidden className="text-foreground">{glyph}</span>
      ) : (
        <Image
          src={icon}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 rounded"
          width={24}
          height={24}
          loading="lazy"
        />
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Tooltip text={description ? `${label} — ${description}` : label}>
          {content}
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-2 text-sm">
        {(() => {
          const isData = typeof finalPreview === "string" && finalPreview.startsWith("data:");
          return (
            <Image
              src={finalPreview}
              alt=""
              className="w-full rounded"
              width={400}
              height={225}
              loading="lazy"
              {...(isData ? { unoptimized: true } : {})}
            />
          );
        })()}
        {description && <p>{description}</p>}
      </PopoverContent>
    </Popover>
  );
});

export default PaletteItem;
