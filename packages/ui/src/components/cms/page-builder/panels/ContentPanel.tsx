// packages/ui/src/components/cms/page-builder/panels/ContentPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../atoms/shadcn";
import { Suspense } from "react";
import editorRegistry from "../editorRegistry";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
  handleInput: (field: string, value: any) => void;
}

export default function ContentPanel({
  component,
  onChange,
  handleInput,
}: Props) {
  const Specific = editorRegistry[component.type];
  return (
    <div className="space-y-2">
      {("minItems" in component || "maxItems" in component) && (
        <>
          <Input
            label="Min Items"
            type="number"
            title="Minimum number of items"
            value={(component as any).minItems ?? ""}
            onChange={(e) => {
              const val =
                e.target.value === "" ? undefined : Number(e.target.value);
              if (val === undefined) {
                handleInput("minItems", undefined);
                return;
              }
              const max = (component as any).maxItems;
              const patch: Partial<PageComponent> = { minItems: val };
              if (max !== undefined && val > max) {
                patch.maxItems = val;
              }
              onChange(patch);
            }}
            min={0}
            max={(component as any).maxItems ?? undefined}
          />
          <Input
            label="Max Items"
            type="number"
            title="Maximum number of items"
            value={(component as any).maxItems ?? ""}
            onChange={(e) => {
              const val =
                e.target.value === "" ? undefined : Number(e.target.value);
              if (val === undefined) {
                handleInput("maxItems", undefined);
                return;
              }
              const min = (component as any).minItems;
              const patch: Partial<PageComponent> = { maxItems: val };
              if (min !== undefined && val < min) {
                patch.minItems = val;
              }
              onChange(patch);
            }}
            min={(component as any).minItems ?? 0}
          />
        </>
      )}
      {("desktopItems" in component ||
        "tabletItems" in component ||
        "mobileItems" in component) && (
        <>
          <Input
            label="Desktop Items"
            type="number"
            title="Items shown on desktop"
            value={(component as any).desktopItems ?? ""}
            onChange={(e) =>
              handleInput(
                "desktopItems",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            min={0}
          />
          <Input
            label="Tablet Items"
            type="number"
            title="Items shown on tablet"
            value={(component as any).tabletItems ?? ""}
            onChange={(e) =>
              handleInput(
                "tabletItems",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            min={0}
          />
          <Input
            label="Mobile Items"
            type="number"
            title="Items shown on mobile"
            value={(component as any).mobileItems ?? ""}
            onChange={(e) =>
              handleInput(
                "mobileItems",
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            min={0}
          />
        </>
      )}
      {"columns" in component && (
        <Input
          label="Columns"
          type="number"
          title="Number of columns"
          value={(component as any).columns ?? ""}
          onChange={(e) =>
            handleInput(
              "columns",
              e.target.value === "" ? undefined : Number(e.target.value)
            )
          }
          min={(component as any).minItems}
          max={(component as any).maxItems}
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

