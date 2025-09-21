"use client";

import type { PageComponent } from "@acme/types";
import { Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
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
  const handle = <K extends keyof StackFlexExtra>(field: K, value: StackFlexExtra[K]) => {
    onChange({ [field]: value } as Partial<StackFlexExtra>);
  };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Direction</label>
          <Select value={(component as any).direction ?? ""} onValueChange={(v) => handle("direction" as any, (v || undefined) as any)}>
            <SelectTrigger><SelectValue placeholder="default" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="row">row</SelectItem>
              <SelectItem value="column">column</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Desktop</label>
          <Select value={(component as any).directionDesktop ?? ""} onValueChange={(v) => handle("directionDesktop" as any, (v || undefined) as any)}>
            <SelectTrigger><SelectValue placeholder="inherit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="row">row</SelectItem>
              <SelectItem value="column">column</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tablet</label>
          <Select value={(component as any).directionTablet ?? ""} onValueChange={(v) => handle("directionTablet" as any, (v || undefined) as any)}>
            <SelectTrigger><SelectValue placeholder="inherit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="row">row</SelectItem>
              <SelectItem value="column">column</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Mobile</label>
          <Select value={(component as any).directionMobile ?? ""} onValueChange={(v) => handle("directionMobile" as any, (v || undefined) as any)}>
            <SelectTrigger><SelectValue placeholder="inherit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="row">row</SelectItem>
              <SelectItem value="column">column</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Input label="Gap" value={(component as any).gap ?? ""} onChange={(e) => handle("gap" as any, (e.target.value || undefined) as any)} placeholder="1rem" />
        <Input label="Gap (Desktop)" value={(component as any).gapDesktop ?? ""} onChange={(e) => handle("gapDesktop" as any, (e.target.value || undefined) as any)} />
        <Input label="Gap (Tablet)" value={(component as any).gapTablet ?? ""} onChange={(e) => handle("gapTablet" as any, (e.target.value || undefined) as any)} />
        <Input label="Gap (Mobile)" value={(component as any).gapMobile ?? ""} onChange={(e) => handle("gapMobile" as any, (e.target.value || undefined) as any)} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Justify</label>
          <Select value={(component as any).justify ?? ""} onValueChange={(v) => handle("justify" as any, (v || undefined) as any)}>
            <SelectTrigger><SelectValue placeholder="default" /></SelectTrigger>
            <SelectContent>
              {(["flex-start","center","flex-end","space-between","space-around","space-evenly"] as const).map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Align</label>
          <Select value={(component as any).align ?? ""} onValueChange={(v) => handle("align" as any, (v || undefined) as any)}>
            <SelectTrigger><SelectValue placeholder="default" /></SelectTrigger>
            <SelectContent>
              {(["stretch","flex-start","center","flex-end","baseline"] as const).map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!(component as any).wrap} onCheckedChange={(c) => handle("wrap" as any, (!!c) as any)} /> Wrap</label>
        </div>
      </div>
    </div>
  );
}
