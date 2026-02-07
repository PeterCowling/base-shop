"use client";

import { useTranslations } from "@acme/i18n";

import { Input } from "../../../../atoms/shadcn";

import type { InteractionsProps } from "./types";

export default function HoverEffectsControls({ component, handleInput }: InteractionsProps) {
  const t = useTranslations();
  const hoverScale = component.hoverScale as number | undefined;
  const hoverOpacity = component.hoverOpacity as number | undefined;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="number"
        step="0.01"
        min="0"
        label={t("cms.interactions.hoverScale")}
        placeholder="1.05"
        value={hoverScale ?? ""}
        onChange={(e) =>
          handleInput("hoverScale", e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
      <Input
        type="number"
        step="0.05"
        min="0"
        max="1"
        label={t("cms.interactions.hoverOpacity")}
        placeholder="0.9"
        value={hoverOpacity ?? ""}
        onChange={(e) =>
          handleInput("hoverOpacity", e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
    </div>
  );
}
