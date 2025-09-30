// packages/ui/src/components/cms/page-builder/panels/LottieControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from "../../../atoms/shadcn";
import { useTranslations } from "@acme/i18n";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

export default function LottieControls({ component, handleInput }: Props) {
  const t = useTranslations();
  type LottieFields = {
    lottieUrl?: string;
    lottieAutoplay?: boolean;
    lottieLoop?: boolean;
    lottieSpeed?: number;
    lottieTrigger?: "load" | "hover" | "click" | "in-view" | "scroll";
  };
  const l = component as unknown as Partial<LottieFields>;
  const lottieUrl = l.lottieUrl;
  const lottieAutoplay = l.lottieAutoplay;
  const lottieLoop = l.lottieLoop;
  const lottieSpeed = l.lottieSpeed;
  const lottieTrigger = l.lottieTrigger;

  return (
    <div className="space-y-2">
      <Input
        label={t("cms.lottie.url.label") as string}
        placeholder={t("cms.lottie.url.placeholder") as string}
        value={lottieUrl ?? ""}
        onChange={(e) =>
          (handleInput as unknown as (f: string, v: unknown) => void)(
            "lottieUrl",
            (e.target.value || undefined) as unknown,
          )
        }
      />
      <div className="grid grid-cols-3 gap-2 items-end">
        <label className="col-span-1 flex items-center justify-between rounded border border-border-3 bg-muted/30 px-3 py-2 text-sm">
          <span>{t("cms.lottie.autoplay")}</span>
          <Checkbox
            checked={!!lottieAutoplay}
            onCheckedChange={(v) =>
              (handleInput as unknown as (f: string, v: unknown) => void)(
                "lottieAutoplay",
                Boolean(v) as unknown,
              )
            }
          />
        </label>
        <label className="col-span-1 flex items-center justify-between rounded border border-border-3 bg-muted/30 px-3 py-2 text-sm">
          <span>{t("cms.lottie.loop")}</span>
          <Checkbox
            checked={!!lottieLoop}
            onCheckedChange={(v) =>
              (handleInput as unknown as (f: string, v: unknown) => void)(
                "lottieLoop",
                Boolean(v) as unknown,
              )
            }
          />
        </label>
        <Input
          type="number"
          step="0.1"
          min="0.1"
          label={t("cms.lottie.speed") as string}
          placeholder={"1"}
          value={lottieSpeed ?? ""}
          onChange={(e) =>
            (handleInput as unknown as (f: string, v: unknown) => void)(
              "lottieSpeed",
              (e.target.value === "" ? undefined : Number(e.target.value)) as unknown,
            )
          }
        />
      </div>
      <Select
        value={lottieTrigger ?? "load"}
        onValueChange={(v) =>
          (handleInput as unknown as (f: string, v: unknown) => void)(
            "lottieTrigger",
            v as unknown,
          )
        }
      >
        <SelectTrigger aria-label={t("cms.lottie.trigger.aria") as string}>
          <SelectValue placeholder={t("cms.lottie.trigger.placeholder") as string} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="load">{t("cms.lottie.trigger.onLoad")}</SelectItem>
          <SelectItem value="in-view">{t("cms.lottie.trigger.onInView")}</SelectItem>
          <SelectItem value="hover">{t("cms.lottie.trigger.onHover")}</SelectItem>
          <SelectItem value="click">{t("cms.lottie.trigger.onClick")}</SelectItem>
          <SelectItem value="scroll">{t("cms.lottie.trigger.scrollProgress")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
