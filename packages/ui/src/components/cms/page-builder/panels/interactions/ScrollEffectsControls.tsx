"use client";

import type { InteractionsProps } from "./types";
import { openSelectOnMouseDown } from "./helpers";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../atoms/shadcn";

export default function ScrollEffectsControls({ component, handleInput }: InteractionsProps) {
  const parallax = (component as any).parallax as number | undefined;
  const sticky = (component as any).sticky as ("top" | "bottom") | undefined;
  const stickyOffset = (component as any).stickyOffset as string | number | undefined;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Input
        type="number"
        step="0.05"
        min="-5"
        max="5"
        label="Parallax"
        placeholder="0.2"
        value={parallax ?? ""}
        onChange={(e) =>
          handleInput(
            "parallax" as keyof typeof component,
            (e.target.value === "" ? (undefined as any) : (Number(e.target.value) as any)) as any,
          )
        }
      />
      <Select
        value={sticky ?? "__none__"}
        onValueChange={(v) =>
          handleInput(
            "sticky" as keyof typeof component,
            (v === "__none__" ? undefined : (v as any)) as any,
          )
        }
      >
        <SelectTrigger aria-label="Sticky" onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder="Sticky" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None</SelectItem>
          <SelectItem value="top">Top</SelectItem>
          <SelectItem value="bottom">Bottom</SelectItem>
        </SelectContent>
      </Select>
      <Input
        label="Sticky offset"
        placeholder="64px"
        value={stickyOffset ?? ""}
        onChange={(e) =>
          handleInput(
            "stickyOffset" as keyof typeof component,
            (e.target.value === "" ? (undefined as any) : (e.target.value as any)) as any,
          )
        }
      />
    </div>
  );
}

