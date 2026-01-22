// packages/ui/src/components/cms/page-builder/panels/layout/TabSlotControl.tsx
"use client"; // i18n-exempt: Next.js directive

import { useEffect, useState } from "react";

import { Tooltip } from "@acme/design-system/atoms";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

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
      <Tooltip text={t("cms.tabSlot.tip.select")} className="block">
        <SelectTrigger>
          <SelectValue placeholder={t("cms.tabSlot.label")} />
        </SelectTrigger>
      </Tooltip>
      <SelectContent>
        {tabTitles
          .map((title, i) => ({
            value: String(i),
            label: title || t("cms.tabs.default", { n: i + 1 }),
          }))
          .map((opt) => (
            <SelectItem key={`tabslot-${component.id}-${opt.value}`} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  ) : (
    <Input
      label={<span className="flex items-center gap-1">{t("cms.tabSlot.label")}<Tooltip text={t("cms.tabSlot.tip.index")}>?</Tooltip></span>}
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
