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
        {/* i18n-exempt: short builder hint */}
        <Tooltip text="CSS position property" className="block">
          <SelectTrigger>
            {/* i18n-exempt: CSS property name */}
            <SelectValue placeholder="Position" />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          {/* i18n-exempt: CSS keywords */}
          <SelectItem value="relative">relative</SelectItem>
          <SelectItem value="absolute">absolute</SelectItem>
        </SelectContent>
      </Select>
      {component.position === "absolute" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={component.dockX ?? "left"}
              onValueChange={(v) => handleInput("dockX", v as typeof component.dockX)}
            >
              {/* i18n-exempt: builder hint */}
              <Tooltip text="Dock horizontally to container">
                <SelectTrigger>
                  {/* i18n-exempt: control label */}
                  <SelectValue placeholder="Dock X" />
                </SelectTrigger>
              </Tooltip>
              <SelectContent>
                {/* i18n-exempt: editor-only button labels */}
                <SelectItem value="left">Dock Left</SelectItem>
                <SelectItem value="center">Dock Center</SelectItem>
                <SelectItem value="right">Dock Right</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={component.dockY ?? "top"}
              onValueChange={(v) => handleInput("dockY", v as typeof component.dockY)}
            >
              {/* i18n-exempt: builder hint */}
              <Tooltip text="Dock vertically to container">
                <SelectTrigger>
                  {/* i18n-exempt: control label */}
                  <SelectValue placeholder="Dock Y" />
                </SelectTrigger>
              </Tooltip>
              <SelectContent>
                {/* i18n-exempt: editor-only button labels */}
                <SelectItem value="top">Dock Top</SelectItem>
                <SelectItem value="center">Dock Center</SelectItem>
                <SelectItem value="bottom">Dock Bottom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">{/* i18n-exempt: field label */}Top<Tooltip text="CSS top offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px" /* i18n-exempt: example hint */
            value={component.top ?? ""}
            onChange={(v) => handleResize("top", v)}
            axis="h"
            disabled={locked}
            cssProp="top"
          />
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">{/* i18n-exempt: field label */}Left<Tooltip text="CSS left offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px" /* i18n-exempt: example hint */
            value={component.left ?? ""}
            onChange={(v) => handleResize("left", v)}
            axis="w"
            disabled={locked}
            cssProp="left"
          />
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">{/* i18n-exempt: field label */}Right<Tooltip text="CSS right offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px" /* i18n-exempt: example hint */
            value={component.right ?? ""}
            onChange={(v) => handleResize("right", v)}
            axis="w"
            disabled={locked}
            cssProp="right"
          />
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">{/* i18n-exempt: field label */}Bottom<Tooltip text="CSS bottom offset (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 10px" /* i18n-exempt: example hint */
            value={component.bottom ?? ""}
            onChange={(v) => handleResize("bottom", v)}
            axis="h"
            disabled={locked}
            cssProp="bottom"
          />
          {(() => {
            const isPinnedLeft = !!component.left;
            const isPinnedRight = !!component.right;
            const isPinnedTop = !!component.top;
            const isPinnedBottom = !!component.bottom;
            const pinLeft = () => {
              try {
                const el = document.querySelector(`[data-component-id="${component.id}"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const left = Math.round(rect.left - pRect.left);
                handleInput("dockX", "left");
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
                handleInput("dockX", "right");
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
                handleInput("dockY", "top");
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
                handleInput("dockY", "bottom");
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
                handleInput("dockX", "left");
                handleResize("left", `${left}px`);
                handleResize("right", `${right}px`);
                handleInput("width", undefined);
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
                handleInput("dockY", "top");
                handleResize("top", `${top}px`);
                handleResize("bottom", `${bottom}px`);
                handleInput("height", undefined);
              } catch {}
            };
            return (
              <div className="mt-1 grid grid-cols-2 gap-2">
                <div className="flex flex-wrap gap-2">
                  {/* i18n-exempt: editor-only control text */}
                  <Button type="button" variant={isPinnedLeft ? "default" : "outline"} disabled={locked} onClick={pinLeft} aria-label="Pin Left">Pin Left</Button>
                  <Button type="button" variant={isPinnedRight ? "default" : "outline"} disabled={locked} onClick={pinRight} aria-label="Pin Right">Pin Right</Button>
                  <Button type="button" variant={isPinnedTop ? "default" : "outline"} disabled={locked} onClick={pinTop} aria-label="Pin Top">Pin Top</Button>
                  <Button type="button" variant={isPinnedBottom ? "default" : "outline"} disabled={locked} onClick={pinBottom} aria-label="Pin Bottom">Pin Bottom</Button>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {/* i18n-exempt: editor-only control text */}
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
