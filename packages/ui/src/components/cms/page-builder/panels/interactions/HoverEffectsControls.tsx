"use client";

import type { InteractionsProps } from "./types";
import { Input } from "../../../../atoms/shadcn";

export default function HoverEffectsControls({ component, handleInput }: InteractionsProps) {
  const hoverScale = (component as any).hoverScale as number | undefined;
  const hoverOpacity = (component as any).hoverOpacity as number | undefined;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="number"
        step="0.01"
        min="0"
        label="Hover scale"
        placeholder="1.05"
        value={hoverScale ?? ""}
        onChange={(e) =>
          handleInput(
            "hoverScale" as keyof typeof component,
            (e.target.value === "" ? (undefined as any) : (Number(e.target.value) as any)) as any,
          )
        }
      />
      <Input
        type="number"
        step="0.05"
        min="0"
        max="1"
        label="Hover opacity"
        placeholder="0.9"
        value={hoverOpacity ?? ""}
        onChange={(e) =>
          handleInput(
            "hoverOpacity" as keyof typeof component,
            (e.target.value === "" ? (undefined as any) : (Number(e.target.value) as any)) as any,
          )
        }
      />
    </div>
  );
}

