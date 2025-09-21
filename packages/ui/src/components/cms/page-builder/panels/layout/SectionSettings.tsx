// packages/ui/src/components/cms/page-builder/panels/layout/SectionSettings.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import UnitInput from "./UnitInput";
import { isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  locked: boolean;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
  handleResize: (field: string, value: string) => void;
}

export default function SectionSettings({ component, locked, handleInput, handleResize }: Props) {
  if ((component as any).type !== "Section") return null;
  return (
    <>
      <UnitInput
        componentId={component.id}
        label={<span className="flex items-center gap-1">Content Max Width<Tooltip text="Max content width (px/%/rem). Leave empty for full width">?</Tooltip></span>}
        placeholder="e.g. 1200px or 80%"
        value={(component as any).contentWidth ?? ""}
        onChange={(v) => handleInput("contentWidth" as any, (v || undefined) as any)}
        axis="w"
        disabled={locked}
        cssProp="max-width"
      />
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <UnitInput
          key={`cw-${vp}`}
          componentId={component.id}
          label={<span className="flex items-center gap-1">{`Content Max Width (${vp})`}<Tooltip text="Viewport-specific max width overrides">?</Tooltip></span>}
          placeholder="e.g. 1200px or 80%"
          value={((component as any)[`contentWidth${vp}`] as string) ?? ""}
          onChange={(v) => handleResize(`contentWidth${vp}`, v)}
          axis="w"
          disabled={locked}
          cssProp="max-width"
        />
      ))}
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        isOverridden((component as any).contentWidth, (component as any)[`contentWidth${vp}`]) ? (
          <div key={`cwo-${vp}`} className="-mt-1 flex items-center gap-2 text-[10px]">
            <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
            <button type="button" className="underline" onClick={() => handleResize(`contentWidth${vp}`, "")}>Reset</button>
          </div>
        ) : null
      ))}
      <Select
        value={(component as any).contentAlign ?? "center"}
        onValueChange={(v) => handleInput("contentAlign" as any, v as any)}
      >
        <Tooltip text="Horizontal alignment for constrained content" className="block">
          <SelectTrigger>
            <SelectValue placeholder="Content Align" />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          <SelectItem value="left">Left</SelectItem>
          <SelectItem value="center">Center</SelectItem>
          <SelectItem value="right">Right</SelectItem>
        </SelectContent>
      </Select>
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <Select
          key={`ca-${vp}`}
          value={((component as any)[`contentAlign${vp}`] as string) ?? ""}
          onValueChange={(v) => handleInput(`contentAlign${vp}` as any, (v || undefined) as any)}
        >
          <Tooltip text={`Alignment on ${vp.toLowerCase()}`} className="block">
            <SelectTrigger>
              <SelectValue placeholder={`Content Align (${vp})`} />
            </SelectTrigger>
          </Tooltip>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      ))}
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        isOverridden((component as any).contentAlign, (component as any)[`contentAlign${vp}`]) ? (
          <div key={`cao-${vp}`} className="-mt-1 flex items-center gap-2 text-[10px]">
            <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
            <button type="button" className="underline" onClick={() => handleInput(`contentAlign${vp}` as any, undefined as any)}>Reset</button>
          </div>
        ) : null
      ))}
      <Input
        label={<span className="flex items-center gap-1">Section Grid Columns<Tooltip text="Override grid columns for this section">?</Tooltip></span>}
        type="number"
        min={1}
        max={24}
        value={(component as any).gridCols ?? ""}
        onChange={(e) => handleInput("gridCols" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)}
      />
      <Input
        label={<span className="flex items-center gap-1">Section Grid Gutter<Tooltip text="Column gap for grid overlay (e.g. 16px)">?</Tooltip></span>}
        placeholder="e.g. 16px"
        value={(component as any).gridGutter ?? ""}
        onChange={(e) => handleInput("gridGutter" as any, (e.target.value || undefined) as any)}
      />
      <Select
        value={((component as any).gridSnap ? "on" : "off")}
        onValueChange={(v) => handleInput("gridSnap" as any, (v === "on") as any)}
      >
        <Tooltip text="Enable snapping to grid for children in this section" className="block">
          <SelectTrigger>
            <SelectValue placeholder="Section Snap" />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          <SelectItem value="off">Snap off</SelectItem>
          <SelectItem value="on">Snap on</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

