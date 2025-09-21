// packages/ui/src/components/cms/page-builder/panels/layout/SizeControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Button } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import UnitInput from "./UnitInput";
import { isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  locked: boolean;
  handleResize: (field: string, value: string) => void;
  handleFullSize: (field: string) => void;
}

export default function SizeControls({ component, locked, handleResize, handleFullSize }: Props) {
  return (
    <>
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={vp} className="space-y-2">
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">{`Width (${vp})`}<Tooltip text="CSS width with unit (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 100px or 50%"
            value={(component[`width${vp}` as keyof PageComponent] as string) ?? ""}
            onChange={(v) => handleResize(`width${vp}`, v)}
            axis="w"
            disabled={locked}
            cssProp="width"
          />
          {isOverridden((component as any).width, (component as any)[`width${vp}`]) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleResize(`width${vp}`, "")}>Reset</button>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={locked} onClick={() => handleFullSize(`width${vp}`)}>Full width</Button>
          </div>
          <UnitInput
            componentId={component.id}
            label={<span className="flex items-center gap-1">{`Height (${vp})`}<Tooltip text="CSS height with unit (px/%/rem)">?</Tooltip></span>}
            placeholder="e.g. 1px or 1rem"
            value={(component[`height${vp}` as keyof PageComponent] as string) ?? ""}
            onChange={(v) => handleResize(`height${vp}`, v)}
            axis="h"
            disabled={locked}
            cssProp="height"
          />
          {isOverridden((component as any).height, (component as any)[`height${vp}`]) && (
            <div className="-mt-1 flex items-center gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button type="button" className="underline" onClick={() => handleResize(`height${vp}`, "")}>Reset</button>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={locked} onClick={() => handleFullSize(`height${vp}`)}>Full height</Button>
          </div>
        </div>
      ))}
    </>
  );
}

