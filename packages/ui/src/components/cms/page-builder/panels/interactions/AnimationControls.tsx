"use client";

import { useTranslations } from "@acme/i18n";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../atoms/shadcn";
import { easingPresets } from "../EasingPresets";

import { openSelectOnMouseDown } from "./helpers";
import type { InteractionsProps } from "./types";

export default function AnimationControls({ component, handleInput }: InteractionsProps) {
  const t = useTranslations();
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
        <SelectTrigger aria-label={t("cms.interactions.animation") as string} onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder={t("cms.interactions.animation") as string} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("cms.interactions.none")}</SelectItem>
          <SelectItem value="fade">{t("cms.interactions.fade")}</SelectItem>
          <SelectItem value="slide">{t("cms.interactions.slideDefault")}</SelectItem>
          <SelectItem value="slide-up">{t("cms.interactions.slideUp")}</SelectItem>
          <SelectItem value="slide-down">{t("cms.interactions.slideDown")}</SelectItem>
          <SelectItem value="slide-left">{t("cms.interactions.slideLeft")}</SelectItem>
          <SelectItem value="slide-right">{t("cms.interactions.slideRight")}</SelectItem>
          <SelectItem value="zoom">{t("cms.interactions.zoom")}</SelectItem>
          <SelectItem value="rotate">{t("cms.interactions.rotate")}</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          label={t("cms.interactions.durationMs")}
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
          label={t("cms.interactions.delayMs")}
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
          <SelectTrigger aria-label={t("cms.interactions.easing") as string} onMouseDown={openSelectOnMouseDown}>
            <SelectValue placeholder={t("cms.interactions.easing") as string} />
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
