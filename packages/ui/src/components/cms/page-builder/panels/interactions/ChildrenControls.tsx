"use client";

import type { InteractionsProps } from "./types";
import { Input } from "../../../../atoms/shadcn";

export default function ChildrenControls({ component, handleInput }: InteractionsProps) {
  const staggerChildren = (component as any).staggerChildren as number | undefined;

  return (
    <Input
      type="number"
      label="Stagger children (ms)"
      placeholder="80"
      value={staggerChildren ?? ""}
      onChange={(e) =>
        handleInput(
          "staggerChildren" as keyof typeof component,
          (e.target.value === "" ? (undefined as any) : (Math.max(0, Number(e.target.value)) as any)) as any,
        )
      }
    />
  );
}

