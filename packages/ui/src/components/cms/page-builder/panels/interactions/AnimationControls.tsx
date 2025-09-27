"use client";

// i18n-exempt file — editor-only builder controls; copy pending i18n wiring

import type { InteractionsProps } from "./types";
import { openSelectOnMouseDown } from "./helpers";
import { easingPresets } from "../EasingPresets";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../atoms/shadcn";

export default function AnimationControls({ component, handleInput }: InteractionsProps) {
  const animation = component.animation ?? "none";
  const duration = component.animationDuration;
  const delay = component.animationDelay;
  const easing = component.animationEasing;

  return (
    <div className="space-y-2">
      <Select
        value={animation}
        onValueChange={(v) =>
          handleInput(
            "animation",
            (v === "none" ? undefined : v) as (typeof component)["animation"],
          )
        }
      >
        <SelectTrigger aria-label="Animation" onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder="Animation" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="fade">Fade</SelectItem>
          <SelectItem value="slide">Slide (default)</SelectItem>
          <SelectItem value="slide-up">Slide Up</SelectItem>
          <SelectItem value="slide-down">Slide Down</SelectItem>
          <SelectItem value="slide-left">Slide Left</SelectItem>
          <SelectItem value="slide-right">Slide Right</SelectItem>
          <SelectItem value="zoom">Zoom</SelectItem>
          <SelectItem value="rotate">Rotate</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          label="Duration (ms)"
          placeholder="500"
          value={duration ?? ""}
          onChange={(e) =>
            handleInput(
              "animationDuration",
              e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
            )
          }
        />
        <Input
          type="number"
          label="Delay (ms)"
          placeholder="0"
          value={delay ?? ""}
          onChange={(e) =>
            handleInput(
              "animationDelay",
              e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
            )
          }
        />
        <Select
          value={easing ?? "__none__"}
          onValueChange={(v) =>
            handleInput(
              "animationEasing",
              v === "__none__" ? undefined : v,
            )
          }
        >
          <SelectTrigger aria-label="Easing" onMouseDown={openSelectOnMouseDown}>
            <SelectValue placeholder="Easing" />
          </SelectTrigger>
          <SelectContent>
            {easingPresets.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
