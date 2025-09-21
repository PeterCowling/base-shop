// packages/ui/src/components/cms/page-builder/panels/layout/PositionControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { Button } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import UnitInput from "./UnitInput";

interface Props {
  component: PageComponent;
  locked: boolean;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
  handleResize: (field: string, value: string) => void;
}

export default function PositionControls({ component, locked, handleInput, handleResize }: Props) {
  return (
    <>
      <Select
        value={component.position ?? ""}
        onValueChange={(v) => handleInput("position", (v || undefined) as PageComponent["position"])}
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
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">Top<Tooltip text="CSS top offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px"
            value={component.top ?? ""}
            onChange={(v) => handleResize("top", v)}
            axis="h"
            disabled={locked}
            cssProp="top"
          />
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">Left<Tooltip text="CSS left offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px"
            value={component.left ?? ""}
            onChange={(v) => handleResize("left", v)}
            axis="w"
            disabled={locked}
            cssProp="left"
          />
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">Right<Tooltip text="CSS right offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px"
            value={(component as any).right ?? ""}
            onChange={(v) => handleResize("right", v)}
            axis="w"
            disabled={locked}
            cssProp="right"
          />
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">Bottom<Tooltip text="CSS bottom offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px"
            value={(component as any).bottom ?? ""}
            onChange={(v) => handleResize("bottom", v)}
            axis="h"
            disabled={locked}
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
                  <Button type="button" variant={isPinnedLeft ? "default" : "outline"} disabled={locked} onClick={pinLeft} aria-label="Pin Left">Pin Left</Button>
                  <Button type="button" variant={isPinnedRight ? "default" : "outline"} disabled={locked} onClick={pinRight} aria-label="Pin Right">Pin Right</Button>
                  <Button type="button" variant={isPinnedTop ? "default" : "outline"} disabled={locked} onClick={pinTop} aria-label="Pin Top">Pin Top</Button>
                  <Button type="button" variant={isPinnedBottom ? "default" : "outline"} disabled={locked} onClick={pinBottom} aria-label="Pin Bottom">Pin Bottom</Button>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" disabled={locked} onClick={stretchX} aria-label="Stretch horizontally">Stretch X</Button>
                  <Button type="button" variant="outline" disabled={locked} onClick={stretchY} aria-label="Stretch vertically">Stretch Y</Button>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </>
  );
}

