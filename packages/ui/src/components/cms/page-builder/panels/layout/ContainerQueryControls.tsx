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
      <div className="mb-1 text-xs font-semibold text-muted-foreground">Container Queries</div>
      <Select
        value={((component as any).containerType as string) ?? ""}
        onValueChange={(v) => handleInput("containerType" as any, (v === "__default__" ? undefined : v) as any)}
      >
        <Tooltip text="Sets CSS container-type for this block so children can use @container" className="block">
          <SelectTrigger>
            <SelectValue placeholder="container-type" />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          <SelectItem value="__default__">default</SelectItem>
          <SelectItem value="size">size</SelectItem>
          <SelectItem value="inline-size">inline-size</SelectItem>
        </SelectContent>
      </Select>
      <Input
        label={<span className="flex items-center gap-1">Container Name<Tooltip text="Name used in @container queries for this block">?</Tooltip></span>}
        placeholder="e.g. card"
        value={((component as any).containerName as string) ?? ""}
        onChange={(e) => handleInput("containerName" as any, (e.target.value || undefined) as any)}
      />
    </div>
  );
}

