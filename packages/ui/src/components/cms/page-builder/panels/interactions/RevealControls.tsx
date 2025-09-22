"use client";

import type { InteractionsProps } from "./types";
import { openSelectOnMouseDown } from "./helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../atoms/shadcn";

export default function RevealControls({ component, handleInput }: InteractionsProps) {
  const reveal = (component as any).reveal as string | undefined;

  return (
    <Select
      value={reveal ?? "__none__"}
      onValueChange={(v) =>
        handleInput(
          "reveal" as keyof typeof component,
          (v === "__none__" ? undefined : (v as any)) as any,
        )
      }
    >
      <SelectTrigger aria-label="Reveal on Scroll" onMouseDown={openSelectOnMouseDown}>
        <SelectValue placeholder="Reveal on Scroll" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">None</SelectItem>
        <SelectItem value="fade">Fade</SelectItem>
        <SelectItem value="slide-up">Slide Up</SelectItem>
        <SelectItem value="slide-down">Slide Down</SelectItem>
        <SelectItem value="slide-left">Slide Left</SelectItem>
        <SelectItem value="slide-right">Slide Right</SelectItem>
        <SelectItem value="zoom">Zoom</SelectItem>
        <SelectItem value="rotate">Rotate</SelectItem>
      </SelectContent>
    </Select>
  );
}

