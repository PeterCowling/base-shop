// packages/ui/src/components/cms/page-builder/panels/layout/SectionSettings.tsx
"use client";

import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import { Tooltip } from "../../../../atoms";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";

import { isOverridden } from "./helpers";
import UnitInput from "./UnitInput";

interface Props {
  component: PageComponent;
  locked: boolean;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
  handleResize: (field: string, value: string) => void;
}

export default function SectionSettings({ component, locked, handleInput, handleResize }: Props) {
  const t = useTranslations();
  if ((component as unknown as { type?: string }).type !== "Section") return null;

  // Narrowly typed helper to avoid explicit `any` while bridging PageComponent
  const setField = <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => {
    handleInput(field, value);
  };
  return (
    <>
      <UnitInput
        componentId={component.id}
        label={<span className="flex items-center gap-1">{t("Content Max Width")}<Tooltip text={t("Max content width (px/%/rem). Leave empty for full width")}>?</Tooltip></span>}
        placeholder={t("e.g. 1200px or 80%") as string}
        value={String(((component as unknown as Record<string, unknown>)["contentWidth"]) ?? "")}
        onChange={(v) => setField("contentWidth" as keyof PageComponent, (v || undefined) as PageComponent[keyof PageComponent])}
        axis="w"
        disabled={locked}
        cssProp="max-width"
      />
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <UnitInput
          key={`cw-${vp}`}
          componentId={component.id}
          label={<span className="flex items-center gap-1">{t(`Content Max Width (${vp})`)}<Tooltip text={t("Viewport-specific max width overrides")}>?</Tooltip></span>}
          placeholder={t("e.g. 1200px or 80%") as string}
          value={((component as unknown as Record<string, unknown>)[`contentWidth${vp}`] as string) ?? ""}
          onChange={(v) => handleResize(`contentWidth${vp}`, v)}
          axis="w"
          disabled={locked}
          cssProp="max-width"
        />
      ))}
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        isOverridden(
          (component as unknown as Record<string, unknown>)["contentWidth"],
          (component as unknown as Record<string, unknown>)[`contentWidth${vp}`]
        ) ? (
          <div key={`cwo-${vp}`} className="mt-1 flex items-center gap-2 text-xs">
            <span className="rounded bg-muted px-1 text-primary">{t("Override active")}</span>
            <Button type="button" variant="ghost" onClick={() => handleResize(`contentWidth${vp}`, "")}>
              {t("Reset")}
            </Button>
          </div>
        ) : null
      ))}
      <Select
        value={(component as unknown as Record<string, string>)["contentAlign"] ?? "center"}
        onValueChange={(v) => setField("contentAlign" as keyof PageComponent, v as PageComponent[keyof PageComponent])}
      >
        <Tooltip text={t("Horizontal alignment for constrained content")} className="block">
          <SelectTrigger>
            <SelectValue placeholder={t("Content Align")} />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          <SelectItem value="left">{t("Left")}</SelectItem>
          <SelectItem value="center">{t("Center")}</SelectItem>
          <SelectItem value="right">{t("Right")}</SelectItem>
        </SelectContent>
      </Select>
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <Select
          key={`ca-${vp}`}
          value={((component as unknown as Record<string, string>)[`contentAlign${vp}`] as string) ?? ""}
          onValueChange={(v) => setField(`contentAlign${vp}` as keyof PageComponent, (v || undefined) as PageComponent[keyof PageComponent])}
        >
          <Tooltip text={t(`Alignment on ${vp.toLowerCase()}`)} className="block">
            <SelectTrigger>
              <SelectValue placeholder={t(`Content Align (${vp})`)} />
            </SelectTrigger>
          </Tooltip>
          <SelectContent>
            <SelectItem value="left">{t("Left")}</SelectItem>
            <SelectItem value="center">{t("Center")}</SelectItem>
            <SelectItem value="right">{t("Right")}</SelectItem>
          </SelectContent>
        </Select>
      ))}
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        isOverridden(
          (component as unknown as Record<string, unknown>)["contentAlign"],
          (component as unknown as Record<string, unknown>)[`contentAlign${vp}`]
        ) ? (
          <div key={`cao-${vp}`} className="mt-1 flex items-center gap-2 text-xs">
            <span className="rounded bg-muted px-1 text-primary">{t("Override active")}</span>
            <Button type="button" variant="ghost" onClick={() => setField(`contentAlign${vp}` as keyof PageComponent, undefined as PageComponent[keyof PageComponent])}>{t("Reset")}</Button>
          </div>
        ) : null
      ))}
      <Input
        label={<span className="flex items-center gap-1">{t("Section Grid Columns")}<Tooltip text={t("Override grid columns for this section")}>?</Tooltip></span>}
        type="number"
        min={1}
        max={24}
        value={(component as unknown as Record<string, number>)["gridCols"] ?? ""}
        onChange={(e) => setField(
          "gridCols" as keyof PageComponent,
          (e.target.value === "" ? undefined : Number(e.target.value)) as PageComponent[keyof PageComponent],
        )}
      />
      <Input
        label={<span className="flex items-center gap-1">{t("Section Grid Gutter")}<Tooltip text={t("Column gap for grid overlay (e.g. 16px)")}>?</Tooltip></span>}
        placeholder={t("e.g. 16px") as string}
        value={(component as unknown as Record<string, string>)["gridGutter"] ?? ""}
        onChange={(e) => setField("gridGutter" as keyof PageComponent, (e.target.value || undefined) as PageComponent[keyof PageComponent])}
      />
      <Select
        value={(((component as unknown as Record<string, unknown>)["gridSnap"] ? "on" : "off"))}
        onValueChange={(v) => setField("gridSnap" as keyof PageComponent, (v === "on") as PageComponent[keyof PageComponent])}
      >
        <Tooltip text={t("Enable snapping to grid for children in this section")} className="block">
          <SelectTrigger>
            <SelectValue placeholder={t("Section Snap")} />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          <SelectItem value="off">{t("Snap off")}</SelectItem>
          <SelectItem value="on">{t("Snap on")}</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
