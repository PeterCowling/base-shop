// packages/ui/src/components/cms/page-builder/panels/content/ResponsiveItems.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import type { ContentComponent, HandleInput } from "./types";
import { nonNegative } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: HandleInput;
}

export default function ResponsiveItems({ component, handleInput }: Props) {
  if (!("desktopItems" in component || "tabletItems" in component || "mobileItems" in component)) {
    return null;
  }

  const comp = component as ContentComponent;
  const desktopItemsError = nonNegative(comp.desktopItems);
  const tabletItemsError = nonNegative(comp.tabletItems);
  const mobileItemsError = nonNegative(comp.mobileItems);

  return (
    <>
      <div className="flex items-center gap-1">
        <Input
          label="Desktop Items"
          type="number"
          value={comp.desktopItems ?? ""}
          onChange={(e) =>
            handleInput(
              "desktopItems" as any,
              (e.target.value === "" ? undefined : Number(e.target.value)) as any,
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
          <button
            type="button"
            className="underline"
            onClick={() => handleInput("desktopItems" as any, undefined as any)}
          >
            Reset
          </button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Input
          label="Tablet Items"
          type="number"
          value={comp.tabletItems ?? ""}
          onChange={(e) =>
            handleInput(
              "tabletItems" as any,
              (e.target.value === "" ? undefined : Number(e.target.value)) as any,
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
          <button
            type="button"
            className="underline"
            onClick={() => handleInput("tabletItems" as any, undefined as any)}
          >
            Reset
          </button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Input
          label="Mobile Items"
          type="number"
          value={comp.mobileItems ?? ""}
          onChange={(e) =>
            handleInput(
              "mobileItems" as any,
              (e.target.value === "" ? undefined : Number(e.target.value)) as any,
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
          <button
            type="button"
            className="underline"
            onClick={() => handleInput("mobileItems" as any, undefined as any)}
          >
            Reset
          </button>
        </div>
      )}
    </>
  );
}

