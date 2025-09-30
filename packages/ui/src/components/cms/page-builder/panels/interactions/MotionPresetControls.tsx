"use client";

import { useTranslations } from "@acme/i18n";
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
  const t = useTranslations();
  const motionPreset = (component.motionPreset as string | undefined) ?? "__none__";

  return (
    <div className="grid grid-cols-3 items-end gap-2">
      <Select
        value={motionPreset}
        onValueChange={(v) => handleInput("motionPreset", v === "__none__" ? undefined : v)}
      >
        <SelectTrigger aria-label={t("cms.interactions.motionPreset") as string} onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder={t("cms.interactions.preset") as string} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{t("cms.interactions.noPreset")}</SelectItem>
          {motionPresets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {t(p.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        className="col-span-2"
        onClick={() => {
          const id = (component.motionPreset as string | undefined) ?? "";
          const preset = motionPresets.find((p) => p.id === id);
          if (preset) preset.apply(handleInput);
        }}
      >
        {t("cms.interactions.applyPreset")}
      </Button>
    </div>
  );
}
