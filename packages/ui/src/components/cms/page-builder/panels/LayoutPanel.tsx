"use client";

import type React from "react";
import type { PageComponent, HistoryState } from "@acme/types";
// Local copy to avoid package export mismatch
type EditorFlags = {
  name?: string;
  locked?: boolean;
  zIndex?: number;
  hidden?: ("desktop" | "tablet" | "mobile")[];
  stackStrategy?: "default" | "reverse" | "custom";
};
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../atoms/shadcn";
import { Tooltip } from "../../../atoms";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K],
  ) => void;
  handleResize: (field: string, value: string) => void;
  handleFullSize: (field: string) => void;
  editorFlags?: EditorFlags;
  onUpdateEditor?: (patch: Partial<EditorFlags>) => void;
  editorMap?: HistoryState["editor"];
  updateEditorForId?: (id: string, patch: Partial<EditorFlags>) => void;
}

export default function LayoutPanel({
  component,
  handleInput,
  handleResize,
  handleFullSize,
  editorFlags,
  onUpdateEditor,
  editorMap,
  updateEditorForId,
}: Props) {
  const cssError = (prop: string, value?: string) =>
    value && !globalThis.CSS?.supports(prop, value)
      ? `Invalid ${prop} value`
      : undefined;
  const effLocked = ((editorFlags as any)?.locked ?? (component as any)?.locked ?? false) as boolean;
  const getRootFontPx = () => {
    const fs = typeof window !== "undefined" ? getComputedStyle(document.documentElement).fontSize : "16px";
    const n = parseFloat(fs || "16");
    return isFinite(n) && n > 0 ? n : 16;
  };

  type Axis = "w" | "h";
  const getParentSize = (axis: Axis) => {
    try {
      const el = document.querySelector(`[data-component-id="${component.id}"]`) as HTMLElement | null;
      const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
      if (!parent) return 0;
      return axis === "w" ? parent.clientWidth : parent.clientHeight;
    } catch {
      return 0;
    }
  };

  const parseVal = (v?: string): { num: number; unit: "%" | "px" | "rem" } => {
    const s = String(v ?? "").trim();
    if (s.endsWith("%")) return { num: parseFloat(s.slice(0, -1)) || 0, unit: "%" };
    if (s.endsWith("rem")) return { num: parseFloat(s.slice(0, -3)) || 0, unit: "rem" };
    if (s.endsWith("px")) return { num: parseFloat(s.slice(0, -2)) || 0, unit: "px" };
    // default to px
    const num = parseFloat(s) || 0;
    return { num, unit: "px" };
  };

  const fmt = (num: number, unit: "%" | "px" | "rem") =>
    `${Number.isFinite(num) ? (unit === "%" ? Math.round(num) : Math.round(num)) : 0}${unit}`;

  const convert = (num: number, from: "%" | "px" | "rem", to: "%" | "px" | "rem", axis: Axis) => {
    if (from === to) return num;
    const basePx = getRootFontPx();
    const parentSize = getParentSize(axis) || 0;
    // Convert from -> px
    let px: number = num;
    if (from === "%") px = parentSize > 0 ? (num / 100) * parentSize : num;
    else if (from === "rem") px = num * basePx;
    // px -> to
    if (to === "%") return parentSize > 0 ? (px / parentSize) * 100 : px;
    if (to === "rem") return basePx > 0 ? px / basePx : px;
    return px;
  };

  const UnitInput = ({
    label,
    value,
    onChange,
    axis,
    placeholder,
    disabled,
    cssProp,
  }: {
    label: React.ReactNode;
    value?: string;
    onChange: (v: string) => void;
    axis: Axis;
    placeholder?: string;
    disabled?: boolean;
    cssProp: string;
  }) => {
    const { num, unit } = parseVal(value);
    return (
      <div className="flex items-end gap-2">
        <Input
          label={label}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          error={cssError(cssProp, value)}
        />
        <Select
          value={unit}
          onValueChange={(next) => {
            const nextUnit = (next as "%" | "px" | "rem");
            const nextNum = convert(num, unit, nextUnit, axis);
            onChange(fmt(nextNum, nextUnit));
          }}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder="unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="px">px</SelectItem>
            <SelectItem value="%">%</SelectItem>
            <SelectItem value="rem">rem</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <Input
          label={
            <span className="flex items-center gap-1">
              z-index
              <Tooltip text="Stacking order (number)">?</Tooltip>
            </span>
          }
          type="number"
          value={(editorFlags?.zIndex as number | undefined) ?? ((component.zIndex as number | undefined) ?? "")}
          onChange={(e) => {
            const val = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
            if (onUpdateEditor) onUpdateEditor({ zIndex: val as number | undefined });
          }}
          disabled={effLocked}
        />
        <div className="flex gap-1">
          <Button type="button" variant="outline" disabled={effLocked} onClick={() => onUpdateEditor?.({ zIndex: Math.max(0, (editorFlags?.zIndex as number | undefined) ?? 0) })}>Back</Button>
          <Button type="button" variant="outline" disabled={effLocked} onClick={() => onUpdateEditor?.({ zIndex: (((editorFlags?.zIndex as number | undefined) ?? 0) - 1) })}>-1</Button>
          <Button type="button" variant="outline" disabled={effLocked} onClick={() => onUpdateEditor?.({ zIndex: (((editorFlags?.zIndex as number | undefined) ?? 0) + 1) })}>+1</Button>
          <Button type="button" variant="outline" disabled={effLocked} onClick={() => onUpdateEditor?.({ zIndex: 999 })}>Front</Button>
        </div>
      </div>
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={vp} className="space-y-2">
          <UnitInput
            label={<span className="flex items-center gap-1">{`Width (${vp})`}<Tooltip text="CSS width with unit (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 100px or 50%"
            value={(component[`width${vp}` as keyof PageComponent] as string) ?? ""}
            onChange={(v) => handleResize(`width${vp}`, v)}
            axis="w"
            disabled={effLocked}
            cssProp="width"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={effLocked} onClick={() => handleFullSize(`width${vp}`)}>Full width</Button>
          </div>
          <UnitInput
            label={<span className="flex items-center gap-1">{`Height (${vp})`}<Tooltip text="CSS height with unit (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 1px or 1rem"
            value={(component[`height${vp}` as keyof PageComponent] as string) ?? ""}
            onChange={(v) => handleResize(`height${vp}`, v)}
            axis="h"
            disabled={effLocked}
            cssProp="height"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={effLocked} onClick={() => handleFullSize(`height${vp}`)}>Full height</Button>
          </div>
        </div>
      ))}
      <Select
        value={component.position ?? ""}
        onValueChange={(v) =>
          handleInput(
            "position",
            (v || undefined) as PageComponent["position"],
          )
        }
      >
        <Tooltip text="CSS position property" className="block">
          <SelectTrigger>
            <SelectValue placeholder="Position" />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          <SelectItem value="relative">relative</SelectItem>
          <SelectItem value="absolute">absolute</SelectItem>
        </SelectContent>
      </Select>
      {component.position === "absolute" && (
        <>
          {/* Docking controls */}
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={(component as any).dockX ?? "left"}
              onValueChange={(v) => handleInput("dockX" as any, v as any)}
            >
              <Tooltip text="Dock horizontally to container">
                <SelectTrigger>
                  <SelectValue placeholder="Dock X" />
                </SelectTrigger>
              </Tooltip>
              <SelectContent>
                <SelectItem value="left">Dock Left</SelectItem>
                <SelectItem value="center">Dock Center</SelectItem>
                <SelectItem value="right">Dock Right</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(component as any).dockY ?? "top"}
              onValueChange={(v) => handleInput("dockY" as any, v as any)}
            >
              <Tooltip text="Dock vertically to container">
                <SelectTrigger>
                  <SelectValue placeholder="Dock Y" />
                </SelectTrigger>
              </Tooltip>
              <SelectContent>
                <SelectItem value="top">Dock Top</SelectItem>
                <SelectItem value="center">Dock Center</SelectItem>
                <SelectItem value="bottom">Dock Bottom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Per-breakpoint top/left */}
          <UnitInput
            label={<span className="flex items-center gap-1">Top<Tooltip text="CSS top offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px"
            value={component.top ?? ""}
            onChange={(v) => handleResize("top", v)}
            axis="h"
            disabled={effLocked}
            cssProp="top"
          />
          <UnitInput
            label={<span className="flex items-center gap-1">Left<Tooltip text="CSS left offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px"
            value={component.left ?? ""}
            onChange={(v) => handleResize("left", v)}
            axis="w"
            disabled={effLocked}
            cssProp="left"
          />
          <UnitInput
            label={<span className="flex items-center gap-1">Right<Tooltip text="CSS right offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px"
            value={(component as any).right ?? ""}
            onChange={(v) => handleResize("right", v)}
            axis="w"
            disabled={effLocked}
            cssProp="right"
          />
          <UnitInput
            label={<span className="flex items-center gap-1">Bottom<Tooltip text="CSS bottom offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px"
            value={(component as any).bottom ?? ""}
            onChange={(v) => handleResize("bottom", v)}
            axis="h"
            disabled={effLocked}
            cssProp="bottom"
          />
          {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
            <div key={`pos-${vp}`} className="grid grid-cols-2 gap-2">
              <UnitInput
                label={<span className="flex items-center gap-1">{`Top (${vp})`}<Tooltip text="CSS top with unit (px/%/rem)">?</Tooltip></span>}
                placeholder="e.g. 10px"
                value={(component[`top${vp}` as keyof PageComponent] as string) ?? ""}
                onChange={(v) => handleResize(`top${vp}`, v)}
                axis="h"
                disabled={effLocked}
                cssProp="top"
              />
              <UnitInput
                label={<span className="flex items-center gap-1">{`Left (${vp})`}<Tooltip text="CSS left with unit (px/%/rem)">?</Tooltip></span>}
                placeholder="e.g. 10px"
                value={(component[`left${vp}` as keyof PageComponent] as string) ?? ""}
                onChange={(v) => handleResize(`left${vp}`, v)}
                axis="w"
                disabled={effLocked}
                cssProp="left"
              />
            </div>
          ))}
        </>
      )}
      {(
        // Heuristic: show stacking option for potential containers
        "children" in (component as any) || "columns" in (component as any)
      ) && (
        <>
          <Select
            value={(editorFlags as any)?.stackStrategy ?? "default"}
            onValueChange={(v) => onUpdateEditor?.({ stackStrategy: (v as any) })}
          >
            <Tooltip text="Mobile stacking strategy for children" className="block">
              <SelectTrigger>
                <SelectValue placeholder="Mobile stacking" />
              </SelectTrigger>
            </Tooltip>
            <SelectContent>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="reverse">Reverse order (mobile)</SelectItem>
              <SelectItem value="custom">Custom order (mobile)</SelectItem>
            </SelectContent>
          </Select>
          {((editorFlags as any)?.stackStrategy === "custom") && Array.isArray((component as any).children) && (
            <div className="mt-2 space-y-2">
              <div className="text-xs text-muted-foreground">Set mobile order for each child (lower appears first)</div>
              {((component as any).children as PageComponent[]).map((child: PageComponent, idx: number) => {
                const childFlags = (editorMap ?? {})[child.id] as any;
                const val = (childFlags?.orderMobile as number | undefined);
                return (
                  <Input
                    key={child.id}
                    type="number"
                    label={`${(child as any).name || child.type}`}
                    placeholder={String(idx)}
                    value={val === undefined ? "" : String(val)}
                    onChange={(e) => {
                      const v = e.target.value === "" ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0);
                      updateEditorForId?.(child.id, { orderMobile: v as number | undefined } as any);
                    }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={`spacing-${vp}`} className="space-y-2">
          <Input
            label={
              <span className="flex items-center gap-1">
                {`Margin (${vp})`}
                <Tooltip text="CSS margin value with units">?</Tooltip>
              </span>
            }
            placeholder="e.g. 1rem"
            value={
              (component[`margin${vp}` as keyof PageComponent] as string) ??
              ""
            }
            error={cssError(
              "margin",
              component[`margin${vp}` as keyof PageComponent] as string
            )}
            onChange={(e) => handleResize(`margin${vp}`, e.target.value)}
          />
          <Input
            label={
              <span className="flex items-center gap-1">
                {`Padding (${vp})`}
                <Tooltip text="CSS padding value with units">?</Tooltip>
              </span>
            }
            placeholder="e.g. 1rem"
            value={
              (component[`padding${vp}` as keyof PageComponent] as string) ??
              ""
            }
            error={cssError(
              "padding",
              component[`padding${vp}` as keyof PageComponent] as string
            )}
            onChange={(e) => handleResize(`padding${vp}`, e.target.value)}
          />
        </div>
      ))}
      <Input
        label={
          <span className="flex items-center gap-1">
            Margin
            <Tooltip text="Global CSS margin value with units">?</Tooltip>
          </span>
        }
        placeholder="e.g. 1rem"
        value={component.margin ?? ""}
        error={cssError("margin", component.margin)}
        onChange={(e) => handleInput("margin", e.target.value)}
      />
      <Input
        label={
          <span className="flex items-center gap-1">
            Padding
            <Tooltip text="Global CSS padding value with units">?</Tooltip>
          </span>
        }
        placeholder="e.g. 1rem"
        value={component.padding ?? ""}
        error={cssError("padding", component.padding)}
        onChange={(e) => handleInput("padding", e.target.value)}
      />
      {"gap" in component && (
        <Input
          label={
            <span className="flex items-center gap-1">
              Gap
              <Tooltip text="Gap between items">?</Tooltip>
            </span>
          }
          placeholder="e.g. 1rem"
          value={(component as { gap?: string }).gap ?? ""}
          error={cssError("gap", (component as { gap?: string }).gap)}
          onChange={(e) => handleInput("gap", e.target.value)}
        />
      )}
      {component.type === "Section" && (
        <>
          <UnitInput
            label={<span className="flex items-center gap-1">Content Max Width<Tooltip text="Max content width (px/%/rem). Leave empty for full width">?</Tooltip></span>}
            placeholder="e.g. 1200px or 80%"
            value={(component as any).contentWidth ?? ""}
            onChange={(v) => handleInput("contentWidth" as any, (v || undefined) as any)}
            axis="w"
            disabled={effLocked}
            cssProp="max-width"
          />
          {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
            <UnitInput
              key={`cw-${vp}`}
              label={<span className="flex items-center gap-1">{`Content Max Width (${vp})`}<Tooltip text="Viewport-specific max width overrides">?</Tooltip></span>}
              placeholder="e.g. 1200px or 80%"
              value={((component as any)[`contentWidth${vp}`] as string) ?? ""}
              onChange={(v) => handleResize(`contentWidth${vp}`, v)}
              axis="w"
              disabled={effLocked}
              cssProp="max-width"
            />
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
          {/* Per-breakpoint content alignment */}
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
      )}

      {/* Grid placement for children inside Grid containers (optional) */}
      <div className="mt-2 border-t pt-2">
        <div className="mb-1 text-xs font-semibold text-muted-foreground">Grid placement (optional)</div>
        <Input
          label={<span className="flex items-center gap-1">Grid Area<Tooltip text="Named area matching grid-template-areas on the parent">?</Tooltip></span>}
          placeholder="e.g. hero"
          value={(component as any).gridArea ?? ""}
          error={cssError("grid-area", (component as any).gridArea)}
          onChange={(e) => handleInput("gridArea" as any, (e.target.value || undefined) as any)}
        />
        <Input
          label={<span className="flex items-center gap-1">Grid Column<Tooltip text="Line, span or range (e.g. '2 / 4' or 'span 2')">?</Tooltip></span>}
          placeholder="e.g. span 2"
          value={(component as any).gridColumn ?? ""}
          error={cssError("grid-column", (component as any).gridColumn)}
          onChange={(e) => handleInput("gridColumn" as any, (e.target.value || undefined) as any)}
        />
        <Input
          label={<span className="flex items-center gap-1">Grid Row<Tooltip text="Line, span or range (e.g. '1 / span 3')">?</Tooltip></span>}
          placeholder="e.g. 1 / span 2"
          value={(component as any).gridRow ?? ""}
          error={cssError("grid-row", (component as any).gridRow)}
          onChange={(e) => handleInput("gridRow" as any, (e.target.value || undefined) as any)}
        />
      </div>
    </div>
  );
}
