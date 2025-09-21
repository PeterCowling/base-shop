// packages/ui/src/components/cms/page-builder/panels/layout/SpacingControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import { cssError, isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
  handleResize: (field: string, value: string) => void;
}

export default function SpacingControls({ component, handleInput, handleResize }: Props) {
  return (
    <>
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
            value={(component[`margin${vp}` as keyof PageComponent] as string) ?? ""}
            error={cssError("margin", component[`margin${vp}` as keyof PageComponent] as string)}
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
            value={(component[`padding${vp}` as keyof PageComponent] as string) ?? ""}
            error={cssError("padding", component[`padding${vp}` as keyof PageComponent] as string)}
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
    </>
  );
}

