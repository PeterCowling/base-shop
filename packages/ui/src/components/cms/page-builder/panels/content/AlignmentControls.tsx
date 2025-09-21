// packages/ui/src/components/cms/page-builder/panels/content/AlignmentControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import type { ContentComponent, HandleInput } from "./types";
import { isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: HandleInput;
}

export default function AlignmentControls({ component, handleInput }: Props) {
  const comp = component as ContentComponent;

  return (
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
        {["Desktop", "Tablet", "Mobile"].map((vp) => (
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
        {["Desktop", "Tablet", "Mobile"].map((vp) => (
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
        {["Desktop", "Tablet", "Mobile"].map((vp) => (
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
        {["Desktop", "Tablet", "Mobile"].map((vp) => (
          isOverridden(comp.alignItems, (comp as any)[`alignItems${vp}`]) ? (
            <div key={`aio-${vp}`} className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleInput(`alignItems${vp}` as any, undefined as any)}>Reset</button>
            </div>
          ) : null
        ))}
      </div>
    </>
  );
}

