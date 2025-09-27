// packages/ui/src/components/cms/page-builder/panels/layout/ContainerQueryControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

export default function ContainerQueryControls({ component, handleInput }: Props) {
  return (
    <div className="mt-2 border-t pt-2">
      {/* i18n-exempt: Builder section title */}
      <div className="mb-1 text-xs font-semibold text-muted-foreground">Container Queries</div>
      <Select
        value={(component as Record<string, unknown>)["containerType"] as string | undefined ?? ""}
        onValueChange={(v) =>
          // Local loosening to support extra builder-only fields
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "containerType",
            v === "__default__" ? (undefined as unknown) : (v as unknown),
          )
        }
      >
        {/* i18n-exempt: short builder hint */}
        <Tooltip text="Sets CSS container-type for this block so children can use @container" className="block">
          <SelectTrigger>
            {/* i18n-exempt: CSS property name */}
            <SelectValue placeholder="container-type" />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          {/* i18n-exempt: CSS keywords */}
          <SelectItem value="__default__">default</SelectItem>
          <SelectItem value="size">size</SelectItem>
          <SelectItem value="inline-size">inline-size</SelectItem>
        </SelectContent>
      </Select>
      <Input
        label={<span className="flex items-center gap-1">{/* i18n-exempt: field label in builder */}Container Name<Tooltip text="Name used in @container queries for this block">?</Tooltip></span>}
        placeholder="e.g. card" /* i18n-exempt: example hint */
        value={(component as Record<string, unknown>)["containerName"] as string | undefined ?? ""}
        onChange={(e) =>
          // Local loosening to support extra builder-only fields
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "containerName",
            (e.target.value || undefined) as unknown,
          )
        }
      />
    </div>
  );
}
