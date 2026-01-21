"use client";

import { useState } from "react";

import { useTranslations } from "@acme/i18n";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@acme/design-system/shadcn";
import LinkPicker from "../../LinkPicker";

import { openSelectOnMouseDown } from "./helpers";
import type { InteractionsProps } from "./types";

export default function ClickActionControls({ component, handleInput }: InteractionsProps) {
  const t = useTranslations();
  const [pickerOpen, setPickerOpen] = useState(false);
  const clickAction = component.clickAction ?? "none";

  return (
    <div className="space-y-2">
      <Select
        value={clickAction}
        onValueChange={(v) => {
          handleInput(
            "clickAction",
            (v === "none" ? undefined : v) as typeof component["clickAction"],
          );
          if (v !== "navigate" && v !== "scroll-to") handleInput("href", undefined);
        }}
      >
        <SelectTrigger aria-label={t("cms.interactions.clickAction") as string} onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder={t("cms.interactions.clickAction") as string} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("cms.interactions.none")}</SelectItem>
          <SelectItem value="navigate">{t("cms.interactions.navigate")}</SelectItem>
          <SelectItem value="scroll-to">{t("cms.interactions.scrollTo")}</SelectItem>
          <SelectItem value="open-modal">{t("cms.interactions.openModal")}</SelectItem>
        </SelectContent>
      </Select>

      {(clickAction === "navigate" || clickAction === "scroll-to") && (
        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <div className="grow">
              <Input
                label={clickAction === "scroll-to" ? t("cms.interactions.targetAnchor") : t("cms.interactions.target")}
                placeholder={clickAction === "scroll-to" ? "#section-id" : "https://example.com"}
                value={component.href ?? ""}
                onChange={(e) => handleInput("href", e.target.value)}
              />
            </div>
            {clickAction === "navigate" && (
              <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
                {t("cms.common.pick")}
              </Button>
            )}
          </div>
          {clickAction === "navigate" && (
            <LinkPicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              onPick={(href) => {
                handleInput("href", href);
                setPickerOpen(false);
              }}
            />
          )}
        </div>
      )}

      {clickAction === "open-modal" && (
        <div>
          <Textarea
            label={t("cms.interactions.modalContent")}
            placeholder={t("cms.common.plainText") as string}
            value={component.modalHtml ?? ""}
            onChange={(e) => handleInput("modalHtml", (e.target.value || undefined))}
            rows={3}
          />
        </div>
      )}
    </div>
  );
}
