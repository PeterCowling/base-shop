// packages/ui/src/components/cms/page-builder/ComponentEditor.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { memo, Suspense } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";
import editorRegistry from "./editorRegistry";
import useComponentInputs from "./useComponentInputs";
import useComponentResize from "./useComponentResize";

interface Props {
  component: PageComponent | null;
  onChange: (patch: Partial<PageComponent>) => void;
  onResize: (patch: {
    width?: string;
    height?: string;
    top?: string;
    left?: string;
    widthDesktop?: string;
    widthTablet?: string;
    widthMobile?: string;
    heightDesktop?: string;
    heightTablet?: string;
    heightMobile?: string;
    marginDesktop?: string;
    marginTablet?: string;
    marginMobile?: string;
    paddingDesktop?: string;
    paddingTablet?: string;
    paddingMobile?: string;
  }) => void;
}

function ComponentEditor({ component, onChange, onResize }: Props) {
  if (!component) return null;

  const { handleInput } = useComponentInputs(onChange);
  const { handleResize, handleFullSize } = useComponentResize(onResize);

  const Specific = editorRegistry[component.type];

  return (
    <div className="space-y-2">
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={vp} className="space-y-2">
          <div className="flex items-end gap-2">
            <Input
              label={`Width (${vp})`}
              placeholder="e.g. 100px or 50%"
              value={(component as any)[`width${vp}`] ?? ""}
              onChange={(e) => handleResize(`width${vp}`, e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFullSize(`width${vp}`)}
            >
              Full width
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Input
              label={`Height (${vp})`}
              placeholder="e.g. 1px or 1rem"
              value={(component as any)[`height${vp}`] ?? ""}
              onChange={(e) => handleResize(`height${vp}`, e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFullSize(`height${vp}`)}
            >
              Full height
            </Button>
          </div>
          <Input
            label={`Margin (${vp})`}
            value={(component as any)[`margin${vp}`] ?? ""}
            onChange={(e) => handleResize(`margin${vp}`, e.target.value)}
          />
          <Input
            label={`Padding (${vp})`}
            value={(component as any)[`padding${vp}`] ?? ""}
            onChange={(e) => handleResize(`padding${vp}`, e.target.value)}
          />
        </div>
      ))}
      <Input
        label="Margin"
        value={component.margin ?? ""}
        onChange={(e) => handleInput("margin", e.target.value)}
      />
      <Input
        label="Padding"
        value={component.padding ?? ""}
        onChange={(e) => handleInput("padding", e.target.value)}
      />
      {("minItems" in component || "maxItems" in component) && (
        <>
          <Input
            label="Min Items"
            type="number"
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
      {"gap" in component && (
        <Input
          label="Gap"
          value={(component as any).gap ?? ""}
          onChange={(e) => handleInput("gap", e.target.value)}
        />
      )}
      <Select
        value={component.position ?? ""}
        onValueChange={(v) => handleInput("position", v || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Position" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relative">relative</SelectItem>
          <SelectItem value="absolute">absolute</SelectItem>
        </SelectContent>
      </Select>
      {component.position === "absolute" && (
        <>
          <Input
            label="Top"
            value={component.top ?? ""}
            onChange={(e) => handleResize("top", e.target.value)}
          />
          <Input
            label="Left"
            value={component.left ?? ""}
            onChange={(e) => handleResize("left", e.target.value)}
          />
        </>
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

export default memo(ComponentEditor);
