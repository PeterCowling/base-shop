"use client";

import React from "react";

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import type { EditorProps } from "./EditorProps";
import GridAreasEditor from "./GridAreasEditor";

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

const GridPresets = ({ onChange }: { onChange: (patch: Partial<GridExtra>) => void }) => {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground">{t("cms.builder.grid.presets")}</span>
      <Button type="button" className="h-8 px-2 py-1 text-xs" variant="outline" onClick={() => onChange({ columns: 2, gap: "1rem", areas: undefined })}>
        {t("cms.builder.grid.presets.cols.2")}
      </Button>
      <Button type="button" className="h-8 px-2 py-1 text-xs" variant="outline" onClick={() => onChange({ columns: 3, gap: "1rem", areas: undefined })}>
        {t("cms.builder.grid.presets.cols.3")}
      </Button>
      <Button type="button" className="h-8 px-2 py-1 text-xs" variant="outline" onClick={() => onChange({ columns: 4, gap: "1rem", areas: undefined })}>
        {t("cms.builder.grid.presets.cols.4")}
      </Button>
      <Button
        type="button"
        className="h-8 px-2 py-1 text-xs"
        variant="outline"
        title={t("cms.builder.grid.presets.collage121.title")}
        onClick={() => onChange({
          columns: 4,
          gap: "1rem",
          rows: 2,
          areas: /* i18n-exempt -- INTL-204 CSS grid template literal, not user-facing copy [ttl=2026-12-31] */ '"a b b c"\n"a b b c"',
        })}
      >
        {t("cms.builder.grid.presets.collage121.label")}
      </Button>
    </div>
  );
};

const GridColumns = ({ component, onChange }: Props) => {
  const t = useTranslations();
  const handle = <K extends keyof GridExtra>(field: K, value: GridExtra[K]) => onChange({ [field]: value } as Partial<GridExtra>);
  return (
    <div className="grid grid-cols-4 gap-2">
      <Input label={t("cms.builder.grid.cols.base")} type="number" value={component.columns ?? ""} onChange={(e) => handle("columns", e.target.value === "" ? undefined : Number(e.target.value))} />
      <Input label={t("cms.builder.grid.cols.desktop")} type="number" value={component.columnsDesktop ?? ""} onChange={(e) => handle("columnsDesktop", e.target.value === "" ? undefined : Number(e.target.value))} />
      <Input label={t("cms.builder.grid.cols.tablet")} type="number" value={component.columnsTablet ?? ""} onChange={(e) => handle("columnsTablet", e.target.value === "" ? undefined : Number(e.target.value))} />
      <Input label={t("cms.builder.grid.cols.mobile")} type="number" value={component.columnsMobile ?? ""} onChange={(e) => handle("columnsMobile", e.target.value === "" ? undefined : Number(e.target.value))} />
    </div>
  );
};

const GridAreas = ({ component, onChange }: Props) => {
  const t = useTranslations();
  const [areasOpen, setAreasOpen] = React.useState(false);
  const handle = <K extends keyof GridExtra>(field: K, value: GridExtra[K]) => onChange({ [field]: value } as Partial<GridExtra>);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground">{t("cms.builder.grid.templateAreas.label")}</label>
        <Button type="button" variant={areasOpen ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => setAreasOpen((v) => !v)}>
          {areasOpen ? t("cms.builder.grid.templateAreas.toggle.closeEditor") : t("cms.builder.grid.templateAreas.toggle.editVisually")}
        </Button>
      </div>
      {!areasOpen && (
        <>
          <Input
            label=""
            value={component.areas ?? ""}
            onChange={(e) => handle("areas", e.target.value || undefined)}
            placeholder={t("cms.builder.grid.templateAreas.placeholder")}
          />
          <p className="text-xs text-muted-foreground">{t("cms.builder.grid.templateAreas.help")}</p>
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
  );
};

const GridAutoFlow = ({ component, onChange }: Props) => {
  const t = useTranslations();
  const handle = <K extends keyof GridExtra>(field: K, value: GridExtra[K]) => onChange({ [field]: value } as Partial<GridExtra>);
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("cms.builder.grid.autoFlow.label")}</label>
      <Select value={component.autoFlow ?? ""} onValueChange={(v) => handle("autoFlow", (v || undefined) as GridExtra["autoFlow"])}>
        <SelectTrigger><SelectValue placeholder={t("cms.builder.grid.autoFlow.placeholder")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="row">{t("cms.builder.grid.autoFlow.option.row")}</SelectItem>
          <SelectItem value="column">{t("cms.builder.grid.autoFlow.option.column")}</SelectItem>
          <SelectItem value="dense">{t("cms.builder.grid.autoFlow.option.dense")}</SelectItem>
          <SelectItem value="row dense">{t("cms.builder.grid.autoFlow.option.rowDense")}</SelectItem>
          <SelectItem value="column dense">{t("cms.builder.grid.autoFlow.option.columnDense")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

const GridRows = ({ component, onChange }: Props) => {
  const t = useTranslations();
  const handle = <K extends keyof GridExtra>(field: K, value: GridExtra[K]) => onChange({ [field]: value } as Partial<GridExtra>);
  return (
    <div className="grid grid-cols-4 gap-2">
      <Input label={t("cms.builder.grid.rows.base")} type="number" value={component.rows ?? ""} onChange={(e) => handle("rows", e.target.value === "" ? undefined : Number(e.target.value))} />
      <Input label={t("cms.builder.grid.rows.desktop")} type="number" value={component.rowsDesktop ?? ""} onChange={(e) => handle("rowsDesktop", e.target.value === "" ? undefined : Number(e.target.value))} />
      <Input label={t("cms.builder.grid.rows.tablet")} type="number" value={component.rowsTablet ?? ""} onChange={(e) => handle("rowsTablet", e.target.value === "" ? undefined : Number(e.target.value))} />
      <Input label={t("cms.builder.grid.rows.mobile")} type="number" value={component.rowsMobile ?? ""} onChange={(e) => handle("rowsMobile", e.target.value === "" ? undefined : Number(e.target.value))} />
    </div>
  );
};

const GridGaps = ({ component, onChange }: Props) => {
  const t = useTranslations();
  const handle = <K extends keyof GridExtra>(field: K, value: GridExtra[K]) => onChange({ [field]: value } as Partial<GridExtra>);
  return (
    <div className="grid grid-cols-4 gap-2">
      <Input label={t("cms.builder.grid.gap.base")} value={component.gap ?? ""} onChange={(e) => handle("gap", e.target.value || undefined)} placeholder={t("cms.builder.grid.gap.placeholder")} />
      <Input label={t("cms.builder.grid.gap.desktop")} value={component.gapDesktop ?? ""} onChange={(e) => handle("gapDesktop", e.target.value || undefined)} />
      <Input label={t("cms.builder.grid.gap.tablet")} value={component.gapTablet ?? ""} onChange={(e) => handle("gapTablet", e.target.value || undefined)} />
      <Input label={t("cms.builder.grid.gap.mobile")} value={component.gapMobile ?? ""} onChange={(e) => handle("gapMobile", e.target.value || undefined)} />
    </div>
  );
};

const GridToggles = ({ component, onChange }: Props) => {
  const t = useTranslations();
  const handle = <K extends keyof GridExtra>(field: K, value: GridExtra[K]) => onChange({ [field]: value } as Partial<GridExtra>);
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button type="button" variant={component.equalizeRows ? "default" : "outline"} onClick={() => handle("equalizeRows", !component.equalizeRows)} title={t("cms.builder.grid.equalizeRows.title")}>
        {t("cms.builder.grid.equalizeRows.label")}
      </Button>
      <Button type="button" variant={component.autoFit ? "default" : "outline"} onClick={() => handle("autoFit", !component.autoFit)} title={t("cms.builder.grid.autoFit.title")}>
        {t("cms.builder.grid.autoFit.label")}
      </Button>
      <Input label={t("cms.builder.grid.minColWidth.label")} placeholder={t("cms.builder.grid.minColWidth.placeholder")} value={component.minColWidth ?? ""} onChange={(e) => handle("minColWidth", e.target.value || undefined)} />
    </div>
  );
};

const GridAlignment = ({ component, onChange }: Props) => {
  const t = useTranslations();
  const handle = <K extends keyof GridExtra>(field: K, value: GridExtra[K]) => onChange({ [field]: value } as Partial<GridExtra>);
  const options = ["start", "center", "end", "stretch"] as const;
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("cms.builder.grid.justifyItems.label")}</label>
        <Select value={component.justifyItems ?? ""} onValueChange={(v) => handle("justifyItems", (v || undefined) as GridExtra["justifyItems"])}>
          <SelectTrigger><SelectValue placeholder={t("cms.builder.layout.containerType.option.default")} /></SelectTrigger>
          <SelectContent>
            {options.map((v) => (
              <SelectItem key={v} value={v}>{t(`cms.builder.grid.alignOption.${v}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("cms.builder.grid.alignItems.label")}</label>
        <Select value={component.alignItems ?? ""} onValueChange={(v) => handle("alignItems", (v || undefined) as GridExtra["alignItems"])}>
          <SelectTrigger><SelectValue placeholder={t("cms.builder.layout.containerType.option.default")} /></SelectTrigger>
          <SelectContent>
            {options.map((v) => (
              <SelectItem key={v} value={v}>{t(`cms.builder.grid.alignOption.${v}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default function GridContainerEditor({ component, onChange }: Props) {
  const t = useTranslations();
  const handle = <K extends keyof GridExtra>(field: K, value: GridExtra[K]) => onChange({ [field]: value } as Partial<GridExtra>);
  return (
    <div className="space-y-2">
      <GridPresets onChange={onChange} />
      <GridColumns component={component} onChange={onChange} />
      <GridAreas component={component} onChange={onChange} />
      <GridAutoFlow component={component} onChange={onChange} />
      <GridRows component={component} onChange={onChange} />
      <Input label={t("cms.builder.grid.rowHeights.label")} value={component.rowHeights ?? ""} onChange={(e) => handle("rowHeights", e.target.value || undefined)} placeholder={t("cms.builder.grid.rowHeights.placeholder")} />
      <GridGaps component={component} onChange={onChange} />
      <GridToggles component={component} onChange={onChange} />
      <GridAlignment component={component} onChange={onChange} />
    </div>
  );
}
