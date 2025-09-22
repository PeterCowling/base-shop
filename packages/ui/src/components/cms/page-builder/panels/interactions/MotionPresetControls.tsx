"use client";

import type { InteractionsProps } from "./types";
import { openSelectOnMouseDown } from "./helpers";
import { motionPresets } from "../MotionPresets";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../atoms/shadcn";

export default function MotionPresetControls({ component, handleInput }: InteractionsProps) {
  const motionPreset = ((component as any).motionPreset as string | undefined) ?? "__none__";

  return (
    <div className="grid grid-cols-3 items-end gap-2">
      <Select
        value={motionPreset}
        onValueChange={(v) =>
          handleInput("motionPreset" as any, v === "__none__" ? (undefined as any) : (v as any))
        }
      >
        <SelectTrigger aria-label="Motion Preset" onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder="Preset" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No preset</SelectItem>
          {motionPresets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        className="col-span-2"
        onClick={() => {
          const id = ((component as any).motionPreset as string | undefined) ?? "";
          const preset = motionPresets.find((p) => p.id === id);
          if (preset) preset.apply(handleInput as any);
        }}
      >
        Apply Preset
      </Button>
    </div>
  );
}

