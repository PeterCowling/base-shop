// packages/ui/src/components/cms/page-builder/panels/layout/GridPlacementControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import { cssError } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

export default function GridPlacementControls({ component, handleInput }: Props) {
  return (
    <div className="mt-2 border-t pt-2">
      <div className="mb-1 text-xs font-semibold text-muted-foreground">Grid placement (optional)</div>
      <Input
        label={<span className="flex items-center gap-1">Grid Area<Tooltip text="Named area matching grid-template-areas on the parent">?</Tooltip></span>}
        placeholder="e.g. hero"
        value={(component as any).gridArea ?? ""}
        error={cssError("grid-area", (component as any).gridArea)}
        onChange={(e) => handleInput("gridArea" as any, (e.target.value || undefined) as any)}
      />
      <Input
        label={<span className="flex items-center gap-1">Grid Column<Tooltip text="Line, span or range (e.g. '2 / 4' or 'span 2')">?</Tooltip></span>}
        placeholder="e.g. span 2"
        value={(component as any).gridColumn ?? ""}
        error={cssError("grid-column", (component as any).gridColumn)}
        onChange={(e) => handleInput("gridColumn" as any, (e.target.value || undefined) as any)}
      />
      <Input
        label={<span className="flex items-center gap-1">Grid Row<Tooltip text="Line, span or range (e.g. '1 / span 3')">?</Tooltip></span>}
        placeholder="e.g. 1 / span 2"
        value={(component as any).gridRow ?? ""}
        error={cssError("grid-row", (component as any).gridRow)}
        onChange={(e) => handleInput("gridRow" as any, (e.target.value || undefined) as any)}
      />
    </div>
  );
}

