// packages/ui/src/components/cms/page-builder/panels/content/ColumnsControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import type { ContentComponent, HandleInput } from "./types";
import { isOverridden, nonNegative } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: HandleInput;
}

export default function ColumnsControls({ component, handleInput }: Props) {
  if (!("columns" in component)) return null;

  const comp = component as ContentComponent;

  const columnsError =
    nonNegative(comp.columns) ||
    (comp.columns !== undefined &&
    ((comp.minItems !== undefined && comp.columns < comp.minItems) ||
      (comp.maxItems !== undefined && comp.columns > comp.maxItems))
      ? "Columns must be between min and max items"
      : undefined);

  return (
    <>
      <div className="flex items-center gap-1">
        <Input
          label="Columns"
          type="number"
          value={comp.columns ?? ""}
          onChange={(e) =>
            handleInput(
              "columns" as any,
              (e.target.value === "" ? undefined : Number(e.target.value)) as any,
            )
          }
          min={comp.minItems}
          max={comp.maxItems}
          error={columnsError}
        />
        <Tooltip text="Number of columns">?</Tooltip>
      </div>

      <div className="flex items-center gap-1">
        <Input
          label="Columns (Desktop)"
          type="number"
          value={comp.columnsDesktop ?? ""}
          onChange={(e) =>
            handleInput(
              "columnsDesktop" as any,
              (e.target.value === "" ? (undefined as any) : (Number(e.target.value) as any)) as any,
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
          <button
            type="button"
            className="underline"
            onClick={() => handleInput("columnsDesktop" as any, undefined as any)}
          >
            Reset
          </button>
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
              (e.target.value === "" ? (undefined as any) : (Number(e.target.value) as any)) as any,
            )
          }
          min={0}
        />
        <Tooltip text="Columns on tablet">?</Tooltip>
      </div>
      {isOverridden(comp.columns, comp.columnsTablet) && (
        <div className="-mt-1 flex items-center gap-2 text-[10px]">
          <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
          <button
            type="button"
            className="underline"
            onClick={() => handleInput("columnsTablet" as any, undefined as any)}
          >
            Reset
          </button>
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
              (e.target.value === "" ? (undefined as any) : (Number(e.target.value) as any)) as any,
            )
          }
          min={0}
        />
        <Tooltip text="Columns on mobile">?</Tooltip>
      </div>
      {isOverridden(comp.columns, comp.columnsMobile) && (
        <div className="-mt-1 flex items-center gap-2 text-[10px]">
          <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
          <button
            type="button"
            className="underline"
            onClick={() => handleInput("columnsMobile" as any, undefined as any)}
          >
            Reset
          </button>
        </div>
      )}
    </>
  );
}

