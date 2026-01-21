"use client";

import { useTranslations } from "@acme/i18n";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/design-system/shadcn";

import { openSelectOnMouseDown } from "./helpers";
import type { InteractionsProps } from "./types";

export default function ScrollEffectsControls({ component, handleInput }: InteractionsProps) {
  const t = useTranslations();
  const parallax = component.parallax as number | undefined;
  const sticky = component.sticky as ("top" | "bottom") | undefined;
  const stickyOffset = component.stickyOffset as string | number | undefined;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Input
        type="number"
        step="0.05"
        min="-5"
        max="5"
        label={t("cms.interactions.parallax")}
        placeholder="0.2"
        value={parallax ?? ""}
        onChange={(e) =>
          handleInput("parallax", e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
      <Select
        value={sticky ?? "__none__"}
        onValueChange={(v) => handleInput("sticky", v === "__none__" ? undefined : (v as typeof component.sticky))}
      >
        <SelectTrigger aria-label={t("cms.interactions.sticky") as string} onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder={t("cms.interactions.sticky") as string} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{t("cms.interactions.none")}</SelectItem>
          <SelectItem value="top">{t("cms.interactions.top")}</SelectItem>
          <SelectItem value="bottom">{t("cms.interactions.bottom")}</SelectItem>
        </SelectContent>
      </Select>
      <Input
        label={t("cms.interactions.stickyOffset")}
        placeholder="64px"
        value={stickyOffset ?? ""}
        onChange={(e) => handleInput("stickyOffset", e.target.value === "" ? undefined : e.target.value)}
      />
    </div>
  );
}
