"use client";

import { useTranslations } from "@acme/i18n";
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
  const t = useTranslations();
  const reveal = component.reveal as string | undefined;

  return (
    <Select
      value={reveal ?? "__none__"}
      onValueChange={(v) => handleInput("reveal", v === "__none__" ? undefined : (v as typeof component.reveal))}
    >
      <SelectTrigger aria-label={t("cms.interactions.revealOnScroll") as string} onMouseDown={openSelectOnMouseDown}>
        <SelectValue placeholder={t("cms.interactions.revealOnScroll") as string} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">{t("cms.interactions.none")}</SelectItem>
        <SelectItem value="fade">{t("cms.interactions.fade")}</SelectItem>
        <SelectItem value="slide-up">{t("cms.interactions.slideUp")}</SelectItem>
        <SelectItem value="slide-down">{t("cms.interactions.slideDown")}</SelectItem>
        <SelectItem value="slide-left">{t("cms.interactions.slideLeft")}</SelectItem>
        <SelectItem value="slide-right">{t("cms.interactions.slideRight")}</SelectItem>
        <SelectItem value="zoom">{t("cms.interactions.zoom")}</SelectItem>
        <SelectItem value="rotate">{t("cms.interactions.rotate")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
