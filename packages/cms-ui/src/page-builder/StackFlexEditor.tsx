"use client";

import type { PageComponent } from "@acme/types";

import { Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/shadcn";

import type { EditorProps } from "./EditorProps";

type StackFlexExtra = PageComponent & {
  direction?: "row" | "column";
  directionDesktop?: "row" | "column";
  directionTablet?: "row" | "column";
  directionMobile?: "row" | "column";
  wrap?: boolean;
  gap?: string;
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  justifyDesktop?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  justifyTablet?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  justifyMobile?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  align?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
  alignDesktop?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
  alignTablet?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
  alignMobile?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
};
type Props = EditorProps<StackFlexExtra>;

export default function StackFlexEditor({ component, onChange }: Props) {
  // i18n-exempt — Editor control labels
  /* i18n-exempt */ const t = (s: string) => s;
  const handle = <K extends keyof StackFlexExtra>(field: K, value: StackFlexExtra[K]) => {
    onChange({ [field]: value } as Partial<StackFlexExtra>);
  };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("Direction")}</label>
          <Select
            value={component.direction ?? ""}
            onValueChange={(v) => handle("direction", (v || undefined) as StackFlexExtra["direction"])}
          >
            <SelectTrigger><SelectValue placeholder="default" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="row">row</SelectItem>
              <SelectItem value="column">column</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("Desktop")}</label>
          <Select
            value={component.directionDesktop ?? ""}
            onValueChange={(v) => handle("directionDesktop", (v || undefined) as StackFlexExtra["directionDesktop"])}
          >
            <SelectTrigger><SelectValue placeholder="inherit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="row">row</SelectItem>
              <SelectItem value="column">column</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("Tablet")}</label>
          <Select
            value={component.directionTablet ?? ""}
            onValueChange={(v) => handle("directionTablet", (v || undefined) as StackFlexExtra["directionTablet"])}
          >
            <SelectTrigger><SelectValue placeholder="inherit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="row">row</SelectItem>
              <SelectItem value="column">column</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("Mobile")}</label>
          <Select
            value={component.directionMobile ?? ""}
            onValueChange={(v) => handle("directionMobile", (v || undefined) as StackFlexExtra["directionMobile"])}
          >
            <SelectTrigger><SelectValue placeholder="inherit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="row">row</SelectItem>
              <SelectItem value="column">column</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Input label={t("Gap")} value={component.gap ?? ""} onChange={(e) => handle("gap", (e.target.value || undefined) as StackFlexExtra["gap"])} placeholder="1rem" />
        <Input label={t("Gap (Desktop)")} value={component.gapDesktop ?? ""} onChange={(e) => handle("gapDesktop", (e.target.value || undefined) as StackFlexExtra["gapDesktop"])} />
        <Input label={t("Gap (Tablet)")} value={component.gapTablet ?? ""} onChange={(e) => handle("gapTablet", (e.target.value || undefined) as StackFlexExtra["gapTablet"])} />
        <Input label={t("Gap (Mobile)")} value={component.gapMobile ?? ""} onChange={(e) => handle("gapMobile", (e.target.value || undefined) as StackFlexExtra["gapMobile"])} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("Justify")}</label>
          <Select
            value={component.justify ?? ""}
            onValueChange={(v) => handle("justify", (v || undefined) as StackFlexExtra["justify"])}
          >
            <SelectTrigger><SelectValue placeholder="default" /></SelectTrigger>
            <SelectContent>
              {(["flex-start","center","flex-end","space-between","space-around","space-evenly"] as const).map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("Align")}</label>
          <Select
            value={component.align ?? ""}
            onValueChange={(v) => handle("align", (v || undefined) as StackFlexExtra["align"])}
          >
            <SelectTrigger><SelectValue placeholder="default" /></SelectTrigger>
            <SelectContent>
              {(["stretch","flex-start","center","flex-end","baseline"] as const).map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={!!component.wrap} onCheckedChange={(c) => handle("wrap", !!c)} /> {t("Wrap")}
          </label>
        </div>
      </div>
    </div>
  );
}
