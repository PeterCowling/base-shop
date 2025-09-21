// packages/ui/src/components/cms/page-builder/panels/layout/TabSlotControl.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import { useEffect, useState } from "react";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

export default function TabSlotControl({ component, handleInput }: Props) {
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
      value={((component as any).slotKey ?? "0") as any}
      onValueChange={(v) => handleInput("slotKey" as any, (v || undefined) as any)}
    >
      <Tooltip text="If inside Tabs, choose which tab this block belongs to" className="block">
        <SelectTrigger>
          <SelectValue placeholder="Tab Slot" />
        </SelectTrigger>
      </Tooltip>
      <SelectContent>
        {tabTitles.map((t, i) => (
          <SelectItem key={`tabtitle-${i}`} value={String(i)}>{t || `Tab ${i + 1}`}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Input
      label={<span className="flex items-center gap-1">Tab Slot<Tooltip text="If inside Tabs, which tab index this block belongs to (0-based)">?</Tooltip></span>}
      type="number"
      min={0}
      value={(((component as any).slotKey ?? "") as any)}
      onChange={(e) => handleInput("slotKey" as any, (e.target.value === "" ? undefined : String(e.target.value)) as any)}
    />
  );
}

