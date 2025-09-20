"use client";

import type { PageComponent } from "@acme/types";
import { Checkbox, Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent & {
    slidesPerView?: number; slidesPerViewDesktop?: number; slidesPerViewTablet?: number; slidesPerViewMobile?: number;
    gap?: string; gapDesktop?: string; gapTablet?: string; gapMobile?: string;
    showArrows?: boolean; showDots?: boolean;
  };
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function CarouselContainerEditor({ component, onChange }: Props) {
  const handle = <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => onChange({ [field]: value } as Partial<PageComponent>);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <Input label="Slides" type="number" min="1" value={((component as any).slidesPerView ?? "") as any} onChange={(e) => handle("slidesPerView" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
        <Input label="Desktop" type="number" min="1" value={((component as any).slidesPerViewDesktop ?? "") as any} onChange={(e) => handle("slidesPerViewDesktop" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
        <Input label="Tablet" type="number" min="1" value={((component as any).slidesPerViewTablet ?? "") as any} onChange={(e) => handle("slidesPerViewTablet" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
        <Input label="Mobile" type="number" min="1" value={((component as any).slidesPerViewMobile ?? "") as any} onChange={(e) => handle("slidesPerViewMobile" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Input label="Gap" value={(component as any).gap ?? ""} onChange={(e) => handle("gap" as any, (e.target.value || undefined) as any)} placeholder="1rem" />
        <Input label="Desktop" value={(component as any).gapDesktop ?? ""} onChange={(e) => handle("gapDesktop" as any, (e.target.value || undefined) as any)} />
        <Input label="Tablet" value={(component as any).gapTablet ?? ""} onChange={(e) => handle("gapTablet" as any, (e.target.value || undefined) as any)} />
        <Input label="Mobile" value={(component as any).gapMobile ?? ""} onChange={(e) => handle("gapMobile" as any, (e.target.value || undefined) as any)} />
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!(component as any).showArrows} onCheckedChange={(c) => handle("showArrows" as any, (!!c) as any)} /> Show arrows</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!(component as any).showDots} onCheckedChange={(c) => handle("showDots" as any, (!!c) as any)} /> Show dots</label>
      </div>
    </div>
  );
}

