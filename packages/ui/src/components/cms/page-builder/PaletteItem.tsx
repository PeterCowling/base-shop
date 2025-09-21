"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useState, useCallback } from "react";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from "../../atoms";
import type { PaletteItemProps } from "./palette.types";

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

  const content = (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      title="Drag or press space/enter to add"
      style={{ transform: CSS.Transform.toString(transform) }}
      className="flex cursor-grab items-center gap-2 rounded border p-2 text-sm"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={handleKeyDown}
    >
      <Image
        src={icon}
        alt=""
        aria-hidden="true"
        className="h-6 w-6 rounded"
        width={24}
        height={24}
        loading="lazy"
      />
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
        <Image
          src={previewImage}
          alt=""
          className="w-full rounded"
          width={400}
          height={225}
          loading="lazy"
        />
        {description && <p>{description}</p>}
      </PopoverContent>
    </Popover>
  );
});

export default PaletteItem;

