"use client";

import type { PageComponent } from "@acme/types";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import GridAreasEditor from "./GridAreasEditor";
import React from "react";

interface Props {
  component: PageComponent & {
    columns?: number; columnsDesktop?: number; columnsTablet?: number; columnsMobile?: number;
    rows?: number; rowsDesktop?: number; rowsTablet?: number; rowsMobile?: number;
    rowHeights?: string;
    gap?: string; gapDesktop?: string; gapTablet?: string; gapMobile?: string;
    /** Named areas in CSS grid-template-areas format */
    areas?: string;
    justifyItems?: "start" | "center" | "end" | "stretch";
    justifyItemsDesktop?: "start" | "center" | "end" | "stretch";
    justifyItemsTablet?: "start" | "center" | "end" | "stretch";
    justifyItemsMobile?: "start" | "center" | "end" | "stretch";
    alignItems?: "start" | "center" | "end" | "stretch";
    alignItemsDesktop?: "start" | "center" | "end" | "stretch";
    alignItemsTablet?: "start" | "center" | "end" | "stretch";
    alignItemsMobile?: "start" | "center" | "end" | "stretch";
    /** Auto-fit columns via minmax() instead of fixed repeat(n,1fr) */
    autoFit?: boolean;
    /** Minimum column width when autoFit is enabled */
    minColWidth?: string;
    /** Equalize implicit row heights (grid-auto-rows: 1fr) */
    equalizeRows?: boolean;
  };
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function GridContainerEditor({ component, onChange }: Props) {
  const handle = <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => onChange({ [field]: value } as Partial<PageComponent>);
  const [areasOpen, setAreasOpen] = React.useState(false);
  return (
    <div className="space-y-2">
      {/* Quick presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Presets</span>
        <Button
          type="button"
          className="h-8 px-2 py-1 text-xs"
          variant="outline"
          onClick={() => onChange({ columns: 2, gap: "1rem", areas: undefined } as any)}
        >
          2 cols
        </Button>
        <Button
          type="button"
          className="h-8 px-2 py-1 text-xs"
          variant="outline"
          onClick={() => onChange({ columns: 3, gap: "1rem", areas: undefined } as any)}
        >
          3 cols
        </Button>
        <Button
          type="button"
          className="h-8 px-2 py-1 text-xs"
          variant="outline"
          onClick={() => onChange({ columns: 4, gap: "1rem", areas: undefined } as any)}
        >
          4 cols
        </Button>
        <Button
          type="button"
          className="h-8 px-2 py-1 text-xs"
          variant="outline"
          title="Collage 1:2:1 (areas: a b b c)"
          onClick={() => onChange({
            columns: 4,
            gap: "1rem",
            rows: 2,
            areas: '"a b b c"\n"a b b c"',
          } as any)}
        >
          Collage 1:2:1
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Input label="Cols" type="number" value={((component as any).columns ?? "") as any} onChange={(e) => handle("columns" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
        <Input label="Cols (Desktop)" type="number" value={((component as any).columnsDesktop ?? "") as any} onChange={(e) => handle("columnsDesktop" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
        <Input label="Cols (Tablet)" type="number" value={((component as any).columnsTablet ?? "") as any} onChange={(e) => handle("columnsTablet" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
        <Input label="Cols (Mobile)" type="number" value={((component as any).columnsMobile ?? "") as any} onChange={(e) => handle("columnsMobile" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground">Template areas</label>
          <Button type="button" variant={areasOpen ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => setAreasOpen((v) => !v)}>
            {areasOpen ? "Close editor" : "Edit visually"}
          </Button>
        </div>
        {!areasOpen && (
          <>
            <Input
              label=""
              value={(component as any).areas ?? ""}
              onChange={(e) => handle("areas" as any, (e.target.value || undefined) as any)}
              placeholder={`"hero hero"\n"left right"`}
            />
            <p className="text-xs text-muted-foreground">CSS format: quote each row, separate by newline. Use "." for empty slots.</p>
          </>
        )}
        {areasOpen && (
          <GridAreasEditor
            value={(component as any).areas as string}
            columns={Number((component as any).columns) || undefined}
            rows={Number((component as any).rows) || undefined}
            onChange={(next) => {
              onChange({
                areas: (next.areas || undefined) as any,
                columns: (next.columns || undefined) as any,
                rows: (next.rows || undefined) as any,
              } as any);
            }}
          />
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Auto flow</label>
        <Select value={(component as any).autoFlow ?? ""} onValueChange={(v) => handle("autoFlow" as any, (v || undefined) as any)}>
          <SelectTrigger><SelectValue placeholder="row (default)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="row">row</SelectItem>
            <SelectItem value="column">column</SelectItem>
            <SelectItem value="dense">dense</SelectItem>
            <SelectItem value="row dense">row dense</SelectItem>
            <SelectItem value="column dense">column dense</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Input label="Rows" type="number" value={((component as any).rows ?? "") as any} onChange={(e) => handle("rows" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
        <Input label="Rows (Desktop)" type="number" value={((component as any).rowsDesktop ?? "") as any} onChange={(e) => handle("rowsDesktop" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
        <Input label="Rows (Tablet)" type="number" value={((component as any).rowsTablet ?? "") as any} onChange={(e) => handle("rowsTablet" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
        <Input label="Rows (Mobile)" type="number" value={((component as any).rowsMobile ?? "") as any} onChange={(e) => handle("rowsMobile" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)} />
      </div>
      <Input label="Row heights (CSS)" value={(component as any).rowHeights ?? ""} onChange={(e) => handle("rowHeights" as any, (e.target.value || undefined) as any)} placeholder="auto 1fr auto or repeat(3, minmax(0, 1fr))" />
      <div className="grid grid-cols-4 gap-2">
        <Input label="Gap" value={(component as any).gap ?? ""} onChange={(e) => handle("gap" as any, (e.target.value || undefined) as any)} placeholder="1rem" />
        <Input label="Gap (Desktop)" value={(component as any).gapDesktop ?? ""} onChange={(e) => handle("gapDesktop" as any, (e.target.value || undefined) as any)} />
        <Input label="Gap (Tablet)" value={(component as any).gapTablet ?? ""} onChange={(e) => handle("gapTablet" as any, (e.target.value || undefined) as any)} />
        <Input label="Gap (Mobile)" value={(component as any).gapMobile ?? ""} onChange={(e) => handle("gapMobile" as any, (e.target.value || undefined) as any)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant={(component as any).equalizeRows ? "default" : "outline"}
          onClick={() => handle("equalizeRows" as any, !((component as any).equalizeRows) as any)}
          title="Equalize implicit row heights (grid-auto-rows: 1fr)"
        >
          Equalize rows
        </Button>
        <Button
          type="button"
          variant={(component as any).autoFit ? "default" : "outline"}
          onClick={() => handle("autoFit" as any, !((component as any).autoFit) as any)}
          title="Use repeat(auto-fit, minmax(min, 1fr)) for columns"
        >
          Auto‑fit minmax
        </Button>
        <Input
          label="Min col width"
          placeholder="e.g. 240px"
          value={(component as any).minColWidth ?? ""}
          onChange={(e) => handle("minColWidth" as any, (e.target.value || undefined) as any)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Justify items</label>
          <Select value={(component as any).justifyItems ?? ""} onValueChange={(v) => handle("justifyItems" as any, (v || undefined) as any)}>
            <SelectTrigger><SelectValue placeholder="default" /></SelectTrigger>
            <SelectContent>
              {(["start","center","end","stretch"] as const).map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Align items</label>
          <Select value={(component as any).alignItems ?? ""} onValueChange={(v) => handle("alignItems" as any, (v || undefined) as any)}>
            <SelectTrigger><SelectValue placeholder="default" /></SelectTrigger>
            <SelectContent>
              {(["start","center","end","stretch"] as const).map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
