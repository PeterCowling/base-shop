"use client";

import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";
import type { CarouselContainerComponent } from "@acme/types/page/layouts/carousel-container";

import { Checkbox, Input } from "../../atoms/shadcn";

interface Props {
  component: CarouselContainerComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function CarouselContainerEditor({ component, onChange }: Props) {
  const t = useTranslations();
  const handle = <K extends keyof CarouselContainerComponent>(field: K, value: CarouselContainerComponent[K]) =>
    onChange({ [field]: value } as Partial<PageComponent>);

  const numberOrEmpty = (v: number | undefined) => (typeof v === "number" ? String(v) : "");

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <Input
          label={t("Slides")}
          type="number"
          min={1}
          value={numberOrEmpty(component.slidesPerView)}
          onChange={(e) => handle("slidesPerView", e.target.value === "" ? undefined : Number(e.target.value))}
        />
        <Input
          label={t("Desktop")}
          type="number"
          min={1}
          value={numberOrEmpty(component.slidesPerViewDesktop)}
          onChange={(e) => handle("slidesPerViewDesktop", e.target.value === "" ? undefined : Number(e.target.value))}
        />
        <Input
          label={t("Tablet")}
          type="number"
          min={1}
          value={numberOrEmpty(component.slidesPerViewTablet)}
          onChange={(e) => handle("slidesPerViewTablet", e.target.value === "" ? undefined : Number(e.target.value))}
        />
        <Input
          label={t("Mobile")}
          type="number"
          min={1}
          value={numberOrEmpty(component.slidesPerViewMobile)}
          onChange={(e) => handle("slidesPerViewMobile", e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Input label={t("Gap")} value={component.gap ?? ""} onChange={(e) => handle("gap", e.target.value || undefined)} placeholder="1rem" />
        <Input label={t("Desktop")} value={component.gapDesktop ?? ""} onChange={(e) => handle("gapDesktop", e.target.value || undefined)} />
        <Input label={t("Tablet")} value={component.gapTablet ?? ""} onChange={(e) => handle("gapTablet", e.target.value || undefined)} />
        <Input label={t("Mobile")} value={component.gapMobile ?? ""} onChange={(e) => handle("gapMobile", e.target.value || undefined)} />
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={!!component.showArrows} onCheckedChange={(c) => handle("showArrows", !!c)} />
          {t("Show arrows")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={!!component.showDots} onCheckedChange={(c) => handle("showDots", !!c)} />
          {t("Show dots")}
        </label>
      </div>
    </div>
  );
}
