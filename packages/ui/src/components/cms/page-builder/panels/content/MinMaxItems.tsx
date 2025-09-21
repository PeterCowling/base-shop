// packages/ui/src/components/cms/page-builder/panels/content/MinMaxItems.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import type { ContentComponent, HandleInput, OnChange } from "./types";
import { nonNegative } from "./helpers";

interface Props {
  component: PageComponent;
  onChange: OnChange;
  handleInput: HandleInput;
}

export default function MinMaxItems({ component, onChange, handleInput }: Props) {
  if (!("minItems" in component || "maxItems" in component)) return null;

  const comp = component as ContentComponent;

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

  return (
    <>
      <div className="flex items-center gap-1">
        <Input
          label="Min Items"
          type="number"
          value={comp.minItems ?? ""}
          onChange={(e) => {
            const val = e.target.value === "" ? undefined : Number(e.target.value);
            if (val === undefined) {
              handleInput("minItems" as any, undefined as any);
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
            const val = e.target.value === "" ? undefined : Number(e.target.value);
            if (val === undefined) {
              handleInput("maxItems" as any, undefined as any);
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
  );
}

