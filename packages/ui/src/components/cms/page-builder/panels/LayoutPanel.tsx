"use client";

import type React from "react";
import type { PageComponent, HistoryState } from "@acme/types";
// Local copy to avoid package export mismatch
type EditorFlags = {
  name?: string;
  locked?: boolean;
  zIndex?: number;
  hidden?: ("desktop" | "tablet" | "mobile")[];
  // Legacy single strategy (mobile); kept for backwards-compat
  stackStrategy?: "default" | "reverse" | "custom";
  // Per-device stacking strategies
  stackDesktop?: "default" | "reverse" | "custom";
  stackTablet?: "default" | "reverse" | "custom";
  stackMobile?: "default" | "reverse" | "custom";
  // Per-device custom orders on children
  orderDesktop?: number;
  orderTablet?: number;
  orderMobile?: number;
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
import { useEffect, useState } from "react";
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
  const isOverridden = (base: unknown, val: unknown) => {
    if (val === undefined || val === "") return false;
    if (base === undefined || base === "") return true;
    const a = String(base).trim();
    const b = String(val).trim();
    return a !== b;
  };
  const [tabTitles, setTabTitles] = useState<string[]>([]);
  useEffect(() => {
    try {
      const el = typeof document !== 'undefined' ? (document.querySelector(`[data-component-id="${component.id}"]`) as HTMLElement | null) : null;
      const parent = el?.closest('[data-tab-titles]') as HTMLElement | null;
      if (!parent) { setTabTitles([]); return; }
      const raw = parent.getAttribute('data-tab-titles');
      if (!raw) { setTabTitles([]); return; }
      const titles = JSON.parse(raw) as string[];
      if (Array.isArray(titles)) setTabTitles(titles);
      else setTabTitles([]);
    } catch { setTabTitles([]); }
  }, [component.id]);
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
          {isOverridden((component as any).width, (component as any)[`width${vp}`]) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleResize(`width${vp}`, "")}>Reset</button>
            </div>
          )}
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
          {isOverridden((component as any).height, (component as any)[`height${vp}`]) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleResize(`height${vp}`, "")}>Reset</button>
            </div>
          )}
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
          {(() => {
            const isPinnedLeft = !!(component as any).left;
            const isPinnedRight = !!(component as any).right;
            const isPinnedTop = !!(component as any).top;
            const isPinnedBottom = !!(component as any).bottom;
            const pinLeft = () => {
              try {
                const el = document.querySelector(`[data-component-id="${component.id}"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const left = Math.round(rect.left - pRect.left);
                handleInput("dockX" as any, "left" as any);
                handleResize("left", `${left}px`);
                // clear right if switching
                handleResize("right", "");
              } catch {}
            };
            const pinRight = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const right = Math.round(pRect.right - rect.right);
                handleInput("dockX" as any, "right" as any);
                handleResize("right", `${right}px`);
                // clear left if switching
                handleResize("left", "");
              } catch {}
            };
            const pinTop = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const top = Math.round(rect.top - pRect.top);
                handleInput("dockY" as any, "top" as any);
                handleResize("top", `${top}px`);
                handleResize("bottom", "");
              } catch {}
            };
            const pinBottom = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const bottom = Math.round(pRect.bottom - rect.bottom);
                handleInput("dockY" as any, "bottom" as any);
                handleResize("bottom", `${bottom}px`);
                handleResize("top", "");
              } catch {}
            };
            const stretchX = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const left = Math.round(rect.left - pRect.left);
                const right = Math.round(pRect.right - rect.right);
                handleInput("dockX" as any, "left" as any);
                handleResize("left", `${left}px`);
                handleResize("right", `${right}px`);
                // let width auto by clearing explicit width
                handleInput("width" as any, undefined as any);
              } catch {}
            };
            const stretchY = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const top = Math.round(rect.top - pRect.top);
                const bottom = Math.round(pRect.bottom - rect.bottom);
                handleInput("dockY" as any, "top" as any);
                handleResize("top", `${top}px`);
                handleResize("bottom", `${bottom}px`);
                handleInput("height" as any, undefined as any);
              } catch {}
            };
            return (
              <div className="mt-1 grid grid-cols-2 gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={isPinnedLeft ? "default" : "outline"} disabled={effLocked} onClick={pinLeft} aria-label="Pin Left">Pin Left</Button>
                  <Button type="button" variant={isPinnedRight ? "default" : "outline"} disabled={effLocked} onClick={pinRight} aria-label="Pin Right">Pin Right</Button>
                  <Button type="button" variant={isPinnedTop ? "default" : "outline"} disabled={effLocked} onClick={pinTop} aria-label="Pin Top">Pin Top</Button>
                  <Button type="button" variant={isPinnedBottom ? "default" : "outline"} disabled={effLocked} onClick={pinBottom} aria-label="Pin Bottom">Pin Bottom</Button>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" disabled={effLocked} onClick={stretchX} aria-label="Stretch horizontally">Stretch X</Button>
                  <Button type="button" variant="outline" disabled={effLocked} onClick={stretchY} aria-label="Stretch vertically">Stretch Y</Button>
                </div>
              </div>
            );
          })()}
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
              {isOverridden((component as any).top, (component as any)[`top${vp}`]) && (
                <div className="-mt-1 col-span-1 flex items-center gap-2 text-[10px]">
                  <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
                  <button type="button" className="underline" onClick={() => handleResize(`top${vp}`, "")}>Reset</button>
                </div>
              )}
              <UnitInput
                label={<span className="flex items-center gap-1">{`Left (${vp})`}<Tooltip text="CSS left with unit (px/%/rem)">?</Tooltip></span>}
                placeholder="e.g. 10px"
                value={(component[`left${vp}` as keyof PageComponent] as string) ?? ""}
                onChange={(v) => handleResize(`left${vp}`, v)}
                axis="w"
                disabled={effLocked}
                cssProp="left"
              />
              {isOverridden((component as any).left, (component as any)[`left${vp}`]) && (
                <div className="-mt-1 col-span-1 flex items-center gap-2 text-[10px]">
                  <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
                  <button type="button" className="underline" onClick={() => handleResize(`left${vp}`, "")}>Reset</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}
      {(
        // Heuristic: show stacking controls for containers (children exist or grid-like)
        "children" in (component as any) || "columns" in (component as any)
      ) && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {(["desktop", "tablet", "mobile"] as const).map((dev) => (
              <Select
                key={`stack-${dev}`}
                value={
                  // prefer explicit per-device flag; fallback to legacy stackStrategy for mobile only
                  (editorFlags as any)?.[`stack${dev.charAt(0).toUpperCase() + dev.slice(1)}`] ??
                  (dev === "mobile" ? ((editorFlags as any)?.stackStrategy ?? "default") : "default")
                }
                onValueChange={(v) => onUpdateEditor?.({ [`stack${dev.charAt(0).toUpperCase() + dev.slice(1)}`]: (v as any) } as any)}
              >
                <Tooltip text={`Stacking on ${dev}`} className="block">
                  <SelectTrigger>
                    <SelectValue placeholder={`Stacking (${dev})`} />
                  </SelectTrigger>
                </Tooltip>
                <SelectContent>
                  <SelectItem value="default">Default order</SelectItem>
                  <SelectItem value="reverse">Reverse</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            ))}
          </div>
          {(["desktop", "tablet", "mobile"] as const).map((dev) => {
            const eff = (editorFlags as any)?.[`stack${dev.charAt(0).toUpperCase() + dev.slice(1)}`] ?? (dev === "mobile" ? ((editorFlags as any)?.stackStrategy ?? "default") : "default");
            if (eff !== "custom" || !Array.isArray((component as any).children)) return null;
            return (
              <div key={`orders-${dev}`} className="mt-2 space-y-2">
                <div className="text-xs text-muted-foreground">Custom order on {dev} (lower appears first)</div>
                {((component as any).children as PageComponent[]).map((child: PageComponent, idx: number) => {
                  const childFlags = (editorMap ?? {})[child.id] as any;
                  const key = `order${dev.charAt(0).toUpperCase() + dev.slice(1)}`;
                  const val = (childFlags?.[key] as number | undefined);
                  return (
                    <Input
                      key={`${child.id}-${dev}`}
                      type="number"
                      label={`${(child as any).name || child.type}`}
                      placeholder={String(idx)}
                      value={val === undefined ? "" : String(val)}
                      onChange={(e) => {
                        const v = e.target.value === "" ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0);
                        updateEditorForId?.(child.id, { [key]: v as number | undefined } as any);
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
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
          {isOverridden((component as any).margin, (component as any)[`margin${vp}`]) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleResize(`margin${vp}`, "")}>Reset</button>
            </div>
          )}
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
          {isOverridden((component as any).padding, (component as any)[`padding${vp}`]) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleResize(`padding${vp}`, "")}>Reset</button>
            </div>
          )}
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
      {/* Tab assignment for children inside tab containers */}
      {tabTitles.length > 0 ? (
        <Select
          value={((component as any).slotKey ?? "0") as any}
          onValueChange={(v) => handleInput("slotKey" as any, (v || undefined) as any)}
        >
          <Tooltip text="If inside Tabs, choose which tab this block belongs to" className="block">
            <SelectTrigger>
              <SelectValue placeholder="Tab Slot" />
            </SelectTrigger>
          </Tooltip>
          <SelectContent>
            {tabTitles.map((t, i) => (
              <SelectItem key={`tabtitle-${i}`} value={String(i)}>{t || `Tab ${i + 1}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          label={<span className="flex items-center gap-1">Tab Slot<Tooltip text="If inside Tabs, which tab index this block belongs to (0-based)">?</Tooltip></span>}
          type="number"
          min={0}
          value={(((component as any).slotKey ?? "") as any)}
          onChange={(e) => handleInput("slotKey" as any, (e.target.value === "" ? undefined : String(e.target.value)) as any)}
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

      {/* Container queries */}
      <div className="mt-2 border-t pt-2">
        <div className="mb-1 text-xs font-semibold text-muted-foreground">Container Queries</div>
        <Select
          value={((component as any).containerType as string) ?? ""}
          onValueChange={(v) => handleInput("containerType" as any, (v || undefined) as any)}
        >
          <Tooltip text="Sets CSS container-type for this block so children can use @container" className="block">
            <SelectTrigger>
              <SelectValue placeholder="container-type" />
            </SelectTrigger>
          </Tooltip>
          <SelectContent>
            <SelectItem value="">default</SelectItem>
            <SelectItem value="size">size</SelectItem>
            <SelectItem value="inline-size">inline-size</SelectItem>
          </SelectContent>
        </Select>
        <Input
          label={<span className="flex items-center gap-1">Container Name<Tooltip text="Name used in @container queries for this block">?</Tooltip></span>}
          placeholder="e.g. card"
          value={((component as any).containerName as string) ?? ""}
          onChange={(e) => handleInput("containerName" as any, (e.target.value || undefined) as any)}
        />
      </div>
    </div>
  );
}
