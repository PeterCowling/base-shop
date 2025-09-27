// packages/ui/src/components/cms/page-builder/panels/layout/TabSlotControl.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import { useEffect, useState } from "react";
import { useTranslations } from "@acme/i18n";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

export default function TabSlotControl({ component, handleInput }: Props) {
  const t = useTranslations();
  const [tabTitles, setTabTitles] = useState<string[]>([]);
  useEffect(() => {
    try {
      const el = typeof document !== 'undefined' ? (document.querySelector(`[data-component-id="${component.id}"]`) as HTMLElement | null) : null;
      const parent = el?.closest('[data-tab-titles]') as HTMLElement | null;
      if (!parent) { setTabTitles([]); return; }
      const raw = parent.getAttribute('data-tab-titles');
      if (!raw) { setTabTitles([]); return; }
      const titles = JSON.parse(raw) as string[];
      if (Array.isArray(titles)) setTabTitles(titles);
      else setTabTitles([]);
    } catch { setTabTitles([]); }
  }, [component.id]);

  return tabTitles.length > 0 ? (
    <Select
      value={((component as unknown as Record<string, unknown>).slotKey as string | undefined) ?? "0"}
      onValueChange={(v) => handleInput("slotKey" as keyof PageComponent, (v || undefined) as PageComponent[keyof PageComponent])}
    >
      <Tooltip text={t("If inside Tabs, choose which tab this block belongs to")} className="block">
        <SelectTrigger>
          <SelectValue placeholder={t("Tab Slot")} />
        </SelectTrigger>
      </Tooltip>
      <SelectContent>
        {tabTitles.map((title, i) => (
          <SelectItem key={`tabtitle-${i}`} value={String(i)}>{title || t(`Tab ${i + 1}`)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Input
      label={<span className="flex items-center gap-1">{t("Tab Slot")}<Tooltip text={t("If inside Tabs, which tab index this block belongs to (0-based)")}>?</Tooltip></span>}
      type="number"
      min={0}
      value={(((component as unknown as Record<string, unknown>).slotKey as string | undefined) ?? "")}
      onChange={(e) => handleInput(
        "slotKey" as keyof PageComponent,
        (e.target.value === "" ? undefined : String(e.target.value)) as PageComponent[keyof PageComponent]
      )}
    />
  );
}
