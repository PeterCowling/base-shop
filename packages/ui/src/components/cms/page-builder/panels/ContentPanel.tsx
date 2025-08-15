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
    value: PageComponent[K]
  ) => void;
}

export default function ContentPanel({
  component,
  onChange,
  handleInput,
}: Props) {
  const Specific = editorRegistry[component.type];
  const nonNegative = (v?: number) =>
    v !== undefined && v < 0 ? "Must be ≥ 0" : undefined;
  const minItemsError =
    nonNegative(component.minItems) ||
    (component.minItems !== undefined &&
    component.maxItems !== undefined &&
    component.minItems > component.maxItems
      ? "Min Items cannot exceed Max Items"
      : undefined);
  const maxItemsError =
    nonNegative(component.maxItems) ||
    (component.minItems !== undefined &&
    component.maxItems !== undefined &&
    component.maxItems < component.minItems
      ? "Max Items cannot be less than Min Items"
      : undefined);
  const desktopItemsError = nonNegative(component.desktopItems);
  const tabletItemsError = nonNegative(component.tabletItems);
  const mobileItemsError = nonNegative(component.mobileItems);
  const columnsError =
    nonNegative(component.columns) ||
    (component.columns !== undefined &&
    ((component.minItems !== undefined &&
      component.columns < component.minItems) ||
      (component.maxItems !== undefined &&
        component.columns > component.maxItems))
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
            value={component.minItems ?? ""}
            onChange={(e) => {
              const val =
                e.target.value === "" ? undefined : Number(e.target.value);
              if (val === undefined) {
                handleInput("minItems", undefined);
                return;
              }
              const max = component.maxItems;
              const patch: Partial<PageComponent> = { minItems: val };
              if (max !== undefined && val > max) {
                patch.maxItems = val;
              }
              onChange(patch);
            }}
            min={0}
            max={component.maxItems ?? undefined}
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
            value={component.maxItems ?? ""}
            onChange={(e) => {
              const val =
                e.target.value === "" ? undefined : Number(e.target.value);
              if (val === undefined) {
                handleInput("maxItems", undefined);
                return;
              }
              const min = component.minItems;
              const patch: Partial<PageComponent> = { maxItems: val };
              if (min !== undefined && val < min) {
                patch.minItems = val;
              }
              onChange(patch);
            }}
            min={component.minItems ?? 0}
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
            value={component.desktopItems ?? ""}
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
            value={component.tabletItems ?? ""}
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
            value={component.mobileItems ?? ""}
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
          value={component.columns ?? ""}
          onChange={(e) =>
            handleInput(
              "columns",
              e.target.value === "" ? undefined : Number(e.target.value)
            )
          }
          min={component.minItems}
          max={component.maxItems}
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
