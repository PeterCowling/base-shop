// packages/ui/src/components/cms/page-builder/panels/content/GapControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import type { ContentComponent, HandleInput } from "./types";
import { isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: HandleInput;
}

export default function GapControls({ component, handleInput }: Props) {
  if (!("gap" in component)) return null;

  const comp = component as ContentComponent;

  return (
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
          <button
            type="button"
            className="underline"
            onClick={() => handleInput("gapDesktop" as any, undefined as any)}
          >
            Reset
          </button>
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
          <button
            type="button"
            className="underline"
            onClick={() => handleInput("gapTablet" as any, undefined as any)}
          >
            Reset
          </button>
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
          <button
            type="button"
            className="underline"
            onClick={() => handleInput("gapMobile" as any, undefined as any)}
          >
            Reset
          </button>
        </div>
      )}
    </>
  );
}

