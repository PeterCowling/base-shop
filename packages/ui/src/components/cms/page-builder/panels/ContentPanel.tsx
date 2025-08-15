// packages/ui/src/components/cms/page-builder/panels/ContentPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../atoms/shadcn";
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
  const Specific = editorRegistry[component.type];
  const comp = component as PageComponent & {
    minItems?: number;
    maxItems?: number;
    desktopItems?: number;
    tabletItems?: number;
    mobileItems?: number;
    columns?: number;
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
          <Input
            label={
              <span className="flex items-center gap-1">
                Min Items
                <Tooltip text="Minimum number of items">?</Tooltip>
              </span>
            }
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
          <Input
            label={
              <span className="flex items-center gap-1">
                Max Items
                <Tooltip text="Maximum number of items">?</Tooltip>
              </span>
            }
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
        </>
      )}
      {("desktopItems" in component ||
        "tabletItems" in component ||
        "mobileItems" in component) && (
        <>
          <Input
            label={
              <span className="flex items-center gap-1">
                Desktop Items
                <Tooltip text="Items shown on desktop">?</Tooltip>
              </span>
            }
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
          <Input
            label={
              <span className="flex items-center gap-1">
                Tablet Items
                <Tooltip text="Items shown on tablet">?</Tooltip>
              </span>
            }
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
          <Input
            label={
              <span className="flex items-center gap-1">
                Mobile Items
                <Tooltip text="Items shown on mobile">?</Tooltip>
              </span>
            }
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
        </>
      )}
      {"columns" in component && (
        <Input
          label={
            <span className="flex items-center gap-1">
              Columns
              <Tooltip text="Number of columns">?</Tooltip>
            </span>
          }
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

