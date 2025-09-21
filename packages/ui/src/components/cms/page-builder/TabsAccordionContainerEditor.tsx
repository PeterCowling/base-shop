"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import { useMemo } from "react";
import type { EditorProps } from "./EditorProps";

type TabsAccordionExtra = PageComponent & {
  mode?: "tabs" | "accordion";
  tabs?: string[];
};
type Props = EditorProps<TabsAccordionExtra>;

export default function TabsAccordionContainerEditor({ component, onChange }: Props) {
  const handle = <K extends keyof TabsAccordionExtra>(field: K, value: TabsAccordionExtra[K]) => onChange({ [field]: value } as Partial<TabsAccordionExtra>);
  const titles = useMemo(() => (Array.isArray((component as any).tabs) ? ((component as any).tabs as string[]) : []), [component]);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Mode</label>
          <Select value={(component as any).mode ?? "tabs"} onValueChange={(v) => handle("mode" as any, (v || undefined) as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tabs">tabs</SelectItem>
              <SelectItem value="accordion">accordion</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          label="Titles (comma-separated)"
          value={titles.join(", ")}
          onChange={(e) => {
            const raw = e.target.value;
            const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
            handle("tabs" as any, (arr.length ? arr : undefined) as any);
          }}
          placeholder="Tab 1, Tab 2, ..."
        />
      </div>
      <p className="text-xs text-muted-foreground">Title count should match child count; otherwise default labels are used.</p>
    </div>
  );
}
