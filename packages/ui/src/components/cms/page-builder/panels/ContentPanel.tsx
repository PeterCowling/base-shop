// packages/ui/src/components/cms/page-builder/panels/ContentPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../atoms/shadcn";
import { Tooltip } from "../../../atoms";
import { Suspense } from "react";
import editorRegistry from "../editorRegistry";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K],
  ) => void;
}

export default function ContentPanel({
  component,
  onChange,
  handleInput,
}: Props) {
  const isOverridden = (base: unknown, val: unknown) => {
    if (val === undefined || val === "") return false;
    if (base === undefined || base === "") return true;
    const a = String(base).trim();
    const b = String(val).trim();
    return a !== b;
  };
  const isMultiColumn = (component as any).type === "MultiColumn";
  const Specific = editorRegistry[component.type];
  const comp = component as PageComponent & {
    minItems?: number;
    maxItems?: number;
    desktopItems?: number;
    tabletItems?: number;
    mobileItems?: number;
    columns?: number;
    columnsDesktop?: number;
    columnsTablet?: number;
    columnsMobile?: number;
    gap?: string;
    gapDesktop?: string;
    gapTablet?: string;
    gapMobile?: string;
    justifyItems?: "start" | "center" | "end" | "stretch";
    justifyItemsDesktop?: "start" | "center" | "end" | "stretch";
    justifyItemsTablet?: "start" | "center" | "end" | "stretch";
    justifyItemsMobile?: "start" | "center" | "end" | "stretch";
    alignItems?: "start" | "center" | "end" | "stretch";
    alignItemsDesktop?: "start" | "center" | "end" | "stretch";
    alignItemsTablet?: "start" | "center" | "end" | "stretch";
    alignItemsMobile?: "start" | "center" | "end" | "stretch";
  };
  const nonNegative = (v?: number) => (v !== undefined && v < 0 ? "Must be ≥ 0" : undefined);
  const minItemsError =
    nonNegative(comp.minItems) ||
    (comp.minItems !== undefined &&
    comp.maxItems !== undefined &&
    comp.minItems > comp.maxItems
      ? "Min Items cannot exceed Max Items"
      : undefined);
  const maxItemsError =
    nonNegative(comp.maxItems) ||
    (comp.minItems !== undefined &&
    comp.maxItems !== undefined &&
    comp.maxItems < comp.minItems
      ? "Max Items cannot be less than Min Items"
      : undefined);
  const desktopItemsError = nonNegative(comp.desktopItems);
  const tabletItemsError = nonNegative(comp.tabletItems);
  const mobileItemsError = nonNegative(comp.mobileItems);
  const columnsError =
    nonNegative(comp.columns) ||
    (comp.columns !== undefined &&
    ((comp.minItems !== undefined && comp.columns < comp.minItems) ||
      (comp.maxItems !== undefined && comp.columns > comp.maxItems))
      ? "Columns must be between min and max items"
      : undefined);
  return (
    <div className="space-y-2">
      {("minItems" in component || "maxItems" in component) && (
        <>
          <div className="flex items-center gap-1">
            <Input
              label="Min Items"
              type="number"
              value={comp.minItems ?? ""}
              onChange={(e) => {
                const val =
                  e.target.value === "" ? undefined : Number(e.target.value);
                if (val === undefined) {
                  handleInput("minItems", undefined);
                  return;
                }
                const max = comp.maxItems;
                const patch: Partial<PageComponent> = { minItems: val };
                if (max !== undefined && val > max) {
                  patch.maxItems = val;
                }
                onChange(patch);
              }}
              min={0}
              max={comp.maxItems ?? undefined}
              error={minItemsError}
            />
            <Tooltip text="Minimum number of items">?</Tooltip>
          </div>
          <div className="flex items-center gap-1">
            <Input
              label="Max Items"
              type="number"
              value={comp.maxItems ?? ""}
              onChange={(e) => {
                const val =
                  e.target.value === "" ? undefined : Number(e.target.value);
                if (val === undefined) {
                  handleInput("maxItems", undefined);
                  return;
                }
                const min = comp.minItems;
                const patch: Partial<PageComponent> = { maxItems: val };
                if (min !== undefined && val < min) {
                  patch.minItems = val;
                }
                onChange(patch);
              }}
              min={comp.minItems ?? 0}
              error={maxItemsError}
            />
            <Tooltip text="Maximum number of items">?</Tooltip>
          </div>
        </>
      )}
      {("desktopItems" in component ||
        "tabletItems" in component ||
        "mobileItems" in component) && (
        <>
          <div className="flex items-center gap-1">
            <Input
              label="Desktop Items"
              type="number"
              value={comp.desktopItems ?? ""}
              onChange={(e) =>
                handleInput(
                  "desktopItems",
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              min={0}
              error={desktopItemsError}
            />
            <Tooltip text="Items shown on desktop">?</Tooltip>
          </div>
          {comp.desktopItems !== undefined && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput("desktopItems" as any, undefined as any)}>Reset</button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Input
              label="Tablet Items"
              type="number"
              value={comp.tabletItems ?? ""}
              onChange={(e) =>
                handleInput(
                  "tabletItems",
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              min={0}
              error={tabletItemsError}
            />
            <Tooltip text="Items shown on tablet">?</Tooltip>
          </div>
          {comp.tabletItems !== undefined && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput("tabletItems" as any, undefined as any)}>Reset</button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Input
              label="Mobile Items"
              type="number"
              value={comp.mobileItems ?? ""}
              onChange={(e) =>
                handleInput(
                  "mobileItems",
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              min={0}
              error={mobileItemsError}
            />
            <Tooltip text="Items shown on mobile">?</Tooltip>
          </div>
          {comp.mobileItems !== undefined && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput("mobileItems" as any, undefined as any)}>Reset</button>
            </div>
          )}
        </>
      )}
      {"columns" in component && (
        <div className="flex items-center gap-1">
          <Input
            label="Columns"
            type="number"
            value={comp.columns ?? ""}
            onChange={(e) =>
              handleInput(
                "columns",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            min={comp.minItems}
            max={comp.maxItems}
            error={columnsError}
          />
          <Tooltip text="Number of columns">?</Tooltip>
        </div>
      )}
      {"columns" in component && (
        <>
          <div className="flex items-center gap-1">
            <Input
              label="Columns (Desktop)"
              type="number"
              value={comp.columnsDesktop ?? ""}
              onChange={(e) =>
                handleInput(
                  "columnsDesktop" as any,
                  e.target.value === "" ? (undefined as any) : (Number(e.target.value) as any)
                )
              }
              min={comp.minItems}
              max={comp.maxItems}
            />
            <Tooltip text="Columns on desktop">?</Tooltip>
          </div>
          {isOverridden(comp.columns, comp.columnsDesktop) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput("columnsDesktop" as any, undefined as any)}>Reset</button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Input
              label="Columns (Tablet)"
              type="number"
              value={comp.columnsTablet ?? ""}
              onChange={(e) =>
                handleInput(
                  "columnsTablet" as any,
                  e.target.value === "" ? (undefined as any) : (Number(e.target.value) as any)
                )
              }
              min={0}
            />
            <Tooltip text="Columns on tablet">?</Tooltip>
          </div>
          {isOverridden(comp.columns, comp.columnsTablet) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput("columnsTablet" as any, undefined as any)}>Reset</button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Input
              label="Columns (Mobile)"
              type="number"
              value={comp.columnsMobile ?? ""}
              onChange={(e) =>
                handleInput(
                  "columnsMobile" as any,
                  e.target.value === "" ? (undefined as any) : (Number(e.target.value) as any)
                )
              }
              min={0}
            />
            <Tooltip text="Columns on mobile">?</Tooltip>
          </div>
          {isOverridden(comp.columns, comp.columnsMobile) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput("columnsMobile" as any, undefined as any)}>Reset</button>
            </div>
          )}
        </>
      )}
      {("gap" in component) && (
        <>
          <div className="flex items-center gap-1">
            <Input
              label="Gap (Desktop)"
              value={comp.gapDesktop ?? ""}
              onChange={(e) => handleInput("gapDesktop" as any, (e.target.value || undefined) as any)}
              placeholder="e.g. 24px"
            />
            <Tooltip text="Gap between items on desktop">?</Tooltip>
          </div>
          {isOverridden(comp.gap, comp.gapDesktop) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput("gapDesktop" as any, undefined as any)}>Reset</button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Input
              label="Gap (Tablet)"
              value={comp.gapTablet ?? ""}
              onChange={(e) => handleInput("gapTablet" as any, (e.target.value || undefined) as any)}
              placeholder="e.g. 16px"
            />
            <Tooltip text="Gap between items on tablet">?</Tooltip>
          </div>
          {isOverridden(comp.gap, comp.gapTablet) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput("gapTablet" as any, undefined as any)}>Reset</button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Input
              label="Gap (Mobile)"
              value={comp.gapMobile ?? ""}
              onChange={(e) => handleInput("gapMobile" as any, (e.target.value || undefined) as any)}
              placeholder="e.g. 8px"
            />
            <Tooltip text="Gap between items on mobile">?</Tooltip>
          </div>
          {isOverridden(comp.gap, comp.gapMobile) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput("gapMobile" as any, undefined as any)}>Reset</button>
            </div>
          )}
        </>
      )}
      {isMultiColumn && (
        <>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-1">
              <Select
                value={comp.justifyItems ?? ""}
                onValueChange={(v) => handleInput("justifyItems" as any, (v || undefined) as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Justify Items (base)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">start</SelectItem>
                  <SelectItem value="center">center</SelectItem>
                  <SelectItem value="end">end</SelectItem>
                  <SelectItem value="stretch">stretch</SelectItem>
                </SelectContent>
              </Select>
              <Tooltip text="Horizontal alignment of items (base)">?</Tooltip>
            </div>
            {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
              <div key={`ji-${vp}`} className="flex items-center gap-1">
                <Select
                  value={(comp as any)[`justifyItems${vp}`] ?? ""}
                  onValueChange={(v) => handleInput(`justifyItems${vp}` as any, (v || undefined) as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Justify Items (${vp})`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">start</SelectItem>
                    <SelectItem value="center">center</SelectItem>
                    <SelectItem value="end">end</SelectItem>
                    <SelectItem value="stretch">stretch</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip text={`Horizontal items alignment on ${vp.toLowerCase()}`}>?</Tooltip>
              </div>
            ))}
            {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
              isOverridden(comp.justifyItems, (comp as any)[`justifyItems${vp}`]) ? (
                <div key={`jio-${vp}`} className="-mt-1 flex items-center gap-2 text-[10px]">
                  <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
                  <button type="button" className="underline" onClick={() => handleInput(`justifyItems${vp}` as any, undefined as any)}>Reset</button>
                </div>
              ) : null
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-1">
              <Select
                value={comp.alignItems ?? ""}
                onValueChange={(v) => handleInput("alignItems" as any, (v || undefined) as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Align Items (base)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">start</SelectItem>
                  <SelectItem value="center">center</SelectItem>
                  <SelectItem value="end">end</SelectItem>
                  <SelectItem value="stretch">stretch</SelectItem>
                </SelectContent>
              </Select>
              <Tooltip text="Vertical alignment of items (base)">?</Tooltip>
            </div>
            {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
              <div key={`ai-${vp}`} className="flex items-center gap-1">
                <Select
                  value={(comp as any)[`alignItems${vp}`] ?? ""}
                  onValueChange={(v) => handleInput(`alignItems${vp}` as any, (v || undefined) as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Align Items (${vp})`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">start</SelectItem>
                    <SelectItem value="center">center</SelectItem>
                    <SelectItem value="end">end</SelectItem>
                    <SelectItem value="stretch">stretch</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip text={`Vertical items alignment on ${vp.toLowerCase()}`}>?</Tooltip>
              </div>
            ))}
            {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
              isOverridden(comp.alignItems, (comp as any)[`alignItems${vp}`]) ? (
                <div key={`aio-${vp}`} className="-mt-1 flex items-center gap-2 text-[10px]">
                  <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
                  <button type="button" className="underline" onClick={() => handleInput(`alignItems${vp}` as any, undefined as any)}>Reset</button>
                </div>
              ) : null
            ))}
          </div>
        </>
      )}
      <Suspense fallback={<p className="text-muted text-sm">Loading...</p>}>
        {Specific ? (
          <Specific component={component} onChange={onChange} />
        ) : (
          <p className="text-muted text-sm">No editable props</p>
        )}
      </Suspense>
    </div>
  );
}
