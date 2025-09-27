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
  // i18n-exempt — CMS editor-only labels; not user-facing copy
  /* i18n-exempt */
  const t = (s: string) => s;
  const handle = <K extends keyof TabsAccordionExtra>(field: K, value: TabsAccordionExtra[K]) =>
    onChange({ [field]: value } as Partial<TabsAccordionExtra>);
  const titles = useMemo(() => (Array.isArray(component.tabs) ? component.tabs : []), [component]);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("Mode")}</label>
          <Select value={component.mode ?? "tabs"} onValueChange={(v) => handle("mode", (v as TabsAccordionExtra["mode"]) || undefined)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tabs">{t("tabs")}</SelectItem>
              <SelectItem value="accordion">{t("accordion")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          label={t("Titles (comma-separated)")}
          value={titles.join(", ")}
          onChange={(e) => {
            const raw = e.target.value;
            const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
            handle("tabs", (arr.length ? arr : undefined) as TabsAccordionExtra["tabs"]);
          }}
          placeholder={t("Tab 1, Tab 2, ...")}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("Title count should match child count; otherwise default labels are used.")}</p>
    </div>
  );
}
