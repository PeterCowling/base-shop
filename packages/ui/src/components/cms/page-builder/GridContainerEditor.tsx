"use client";

import type { PageComponent } from "@acme/types";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import GridAreasEditor from "./GridAreasEditor";
import React from "react";
import type { EditorProps } from "./EditorProps";

type GridExtra = PageComponent & {
  columns?: number; columnsDesktop?: number; columnsTablet?: number; columnsMobile?: number;
  rows?: number; rowsDesktop?: number; rowsTablet?: number; rowsMobile?: number;
  rowHeights?: string;
  gap?: string; gapDesktop?: string; gapTablet?: string; gapMobile?: string;
  /** Named areas in CSS grid-template-areas format */
  areas?: string;
  /** CSS grid-auto-flow value */
  autoFlow?: "row" | "column" | "dense" | "row dense" | "column dense";
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
type Props = EditorProps<GridExtra>;

export default function GridContainerEditor({ component, onChange }: Props) {
  const handle = <K extends keyof GridExtra>(field: K, value: GridExtra[K]) => onChange({ [field]: value } as Partial<GridExtra>);
  const [areasOpen, setAreasOpen] = React.useState(false);
  return (
    <div className="space-y-2">
      {/* Quick presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{/* i18n-exempt */}Presets</span>
        <Button
          type="button"
          className="h-8 px-2 py-1 text-xs"
          variant="outline"
          onClick={() => onChange({ columns: 2, gap: "1rem", areas: undefined })}
        >
          {/* i18n-exempt */}2 cols
        </Button>
        <Button
          type="button"
          className="h-8 px-2 py-1 text-xs"
          variant="outline"
          onClick={() => onChange({ columns: 3, gap: "1rem", areas: undefined })}
        >
          {/* i18n-exempt */}3 cols
        </Button>
        <Button
          type="button"
          className="h-8 px-2 py-1 text-xs"
          variant="outline"
          onClick={() => onChange({ columns: 4, gap: "1rem", areas: undefined })}
        >
          {/* i18n-exempt */}4 cols
        </Button>
        <Button
          type="button"
          className="h-8 px-2 py-1 text-xs"
          variant="outline"
          title={/* i18n-exempt */ "Collage 1:2:1 (areas: a b b c)"}
          onClick={() => onChange({
            columns: 4,
            gap: "1rem",
            rows: 2,
            areas: /* i18n-exempt */ '"a b b c"\n"a b b c"',
          })}
        >
          {/* i18n-exempt */}Collage 1:2:1
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Input label={/* i18n-exempt */ "Cols"} type="number" value={component.columns ?? ""} onChange={(e) => handle("columns", e.target.value === "" ? undefined : Number(e.target.value))} />
        <Input label={/* i18n-exempt */ "Cols (Desktop)"} type="number" value={component.columnsDesktop ?? ""} onChange={(e) => handle("columnsDesktop", e.target.value === "" ? undefined : Number(e.target.value))} />
        <Input label={/* i18n-exempt */ "Cols (Tablet)"} type="number" value={component.columnsTablet ?? ""} onChange={(e) => handle("columnsTablet", e.target.value === "" ? undefined : Number(e.target.value))} />
        <Input label={/* i18n-exempt */ "Cols (Mobile)"} type="number" value={component.columnsMobile ?? ""} onChange={(e) => handle("columnsMobile", e.target.value === "" ? undefined : Number(e.target.value))} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground">{/* i18n-exempt */}Template areas</label>
          <Button type="button" variant={areasOpen ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => setAreasOpen((v) => !v)}>
            {areasOpen ? (/* i18n-exempt */ "Close editor") : (/* i18n-exempt */ "Edit visually")}
          </Button>
        </div>
        {!areasOpen && (
          <>
            <Input
              label=""
              value={component.areas ?? ""}
              onChange={(e) => handle("areas", e.target.value || undefined)}
              placeholder={/* i18n-exempt */ '&quot;hero hero&quot;\n&quot;left right&quot;'}
            />
            <p className="text-xs text-muted-foreground">{/* i18n-exempt */}CSS format: quote each row, separate by newline. Use &quot;.&quot; for empty slots.</p>
          </>
        )}
        {areasOpen && (
          <GridAreasEditor
            value={component.areas as string}
            columns={Number(component.columns) || undefined}
            rows={Number(component.rows) || undefined}
            onChange={(next) => {
              onChange({
                areas: next.areas || undefined,
                columns: next.columns || undefined,
                rows: next.rows || undefined,
              });
            }}
          />
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">{/* i18n-exempt */}Auto flow</label>
        <Select value={component.autoFlow ?? ""} onValueChange={(v) => handle("autoFlow", (v || undefined) as GridExtra["autoFlow"])}>
          <SelectTrigger><SelectValue placeholder={/* i18n-exempt */ "row (default)"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="row">{/* i18n-exempt */}row</SelectItem>
            <SelectItem value="column">{/* i18n-exempt */}column</SelectItem>
            <SelectItem value="dense">{/* i18n-exempt */}dense</SelectItem>
            <SelectItem value="row dense">{/* i18n-exempt */}row dense</SelectItem>
            <SelectItem value="column dense">{/* i18n-exempt */}column dense</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Input label={/* i18n-exempt */ "Rows"} type="number" value={component.rows ?? ""} onChange={(e) => handle("rows", e.target.value === "" ? undefined : Number(e.target.value))} />
        <Input label={/* i18n-exempt */ "Rows (Desktop)"} type="number" value={component.rowsDesktop ?? ""} onChange={(e) => handle("rowsDesktop", e.target.value === "" ? undefined : Number(e.target.value))} />
        <Input label={/* i18n-exempt */ "Rows (Tablet)"} type="number" value={component.rowsTablet ?? ""} onChange={(e) => handle("rowsTablet", e.target.value === "" ? undefined : Number(e.target.value))} />
        <Input label={/* i18n-exempt */ "Rows (Mobile)"} type="number" value={component.rowsMobile ?? ""} onChange={(e) => handle("rowsMobile", e.target.value === "" ? undefined : Number(e.target.value))} />
      </div>
      <Input label={/* i18n-exempt */ "Row heights (CSS)"} value={component.rowHeights ?? ""} onChange={(e) => handle("rowHeights", e.target.value || undefined)} placeholder={/* i18n-exempt */ "auto 1fr auto or repeat(3, minmax(0, 1fr))"} />
      <div className="grid grid-cols-4 gap-2">
        <Input label={/* i18n-exempt */ "Gap"} value={component.gap ?? ""} onChange={(e) => handle("gap", e.target.value || undefined)} placeholder={/* i18n-exempt */ "1rem"} />
        <Input label={/* i18n-exempt */ "Gap (Desktop)"} value={component.gapDesktop ?? ""} onChange={(e) => handle("gapDesktop", e.target.value || undefined)} />
        <Input label={/* i18n-exempt */ "Gap (Tablet)"} value={component.gapTablet ?? ""} onChange={(e) => handle("gapTablet", e.target.value || undefined)} />
        <Input label={/* i18n-exempt */ "Gap (Mobile)"} value={component.gapMobile ?? ""} onChange={(e) => handle("gapMobile", e.target.value || undefined)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant={component.equalizeRows ? "default" : "outline"}
          onClick={() => handle("equalizeRows", !component.equalizeRows)}
          title={/* i18n-exempt */ "Equalize implicit row heights (grid-auto-rows: 1fr)"}
        >
          {/* i18n-exempt */}Equalize rows
        </Button>
        <Button
          type="button"
          variant={component.autoFit ? "default" : "outline"}
          onClick={() => handle("autoFit", !component.autoFit)}
          title={/* i18n-exempt */ "Use repeat(auto-fit, minmax(min, 1fr)) for columns"}
        >
          {/* i18n-exempt */}Auto‑fit minmax
        </Button>
        <Input
          label={/* i18n-exempt */ "Min col width"}
          placeholder={/* i18n-exempt */ "e.g. 240px"}
          value={component.minColWidth ?? ""}
          onChange={(e) => handle("minColWidth", e.target.value || undefined)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{/* i18n-exempt */}Justify items</label>
          <Select value={component.justifyItems ?? ""} onValueChange={(v) => handle("justifyItems", (v || undefined) as GridExtra["justifyItems"])}>
            <SelectTrigger><SelectValue placeholder={/* i18n-exempt */ "default"} /></SelectTrigger>
            <SelectContent>
              {(["start","center","end","stretch"] as const).map((v) => (<SelectItem key={v} value={v}>{/* i18n-exempt */ v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{/* i18n-exempt */}Align items</label>
          <Select value={component.alignItems ?? ""} onValueChange={(v) => handle("alignItems", (v || undefined) as GridExtra["alignItems"])}>
            <SelectTrigger><SelectValue placeholder={/* i18n-exempt */ "default"} /></SelectTrigger>
            <SelectContent>
              {(["start","center","end","stretch"] as const).map((v) => (<SelectItem key={v} value={v}>{/* i18n-exempt */ v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
