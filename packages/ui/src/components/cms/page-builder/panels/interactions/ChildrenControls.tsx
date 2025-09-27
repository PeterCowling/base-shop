"use client";

// i18n-exempt file — editor-only builder controls; copy pending i18n wiring

import type { InteractionsProps } from "./types";
import { Input } from "../../../../atoms/shadcn";

export default function ChildrenControls({ component, handleInput }: InteractionsProps) {
  const staggerChildren = component.staggerChildren;

  return (
    <Input
      type="number"
      label="Stagger children (ms)"
      placeholder="80"
      value={staggerChildren ?? ""}
      onChange={(e) =>
        handleInput(
          "staggerChildren",
          e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
        )
      }
    />
  );
}
