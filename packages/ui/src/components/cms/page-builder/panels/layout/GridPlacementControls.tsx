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
      {/* i18n-exempt: Builder section label */}
      <div className="mb-1 text-xs font-semibold text-muted-foreground">Grid placement (optional)</div>
      <Input
        label={<span className="flex items-center gap-1">{/* i18n-exempt: builder field label */}Grid Area<Tooltip text="Named area matching grid-template-areas on the parent">?</Tooltip></span>}
        placeholder="e.g. hero" /* i18n-exempt: example hint */
        value={(component as Record<string, unknown>)["gridArea"] as string | undefined ?? ""}
        error={cssError("grid-area", (component as Record<string, unknown>)["gridArea"] as string | undefined)}
        onChange={(e) =>
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "gridArea",
            (e.target.value || undefined) as unknown,
          )
        }
      />
      <Input
        label={<span className="flex items-center gap-1">{/* i18n-exempt: builder field label */}Grid Column<Tooltip text="Line, span or range (e.g. '2 / 4' or 'span 2')">?</Tooltip></span>}
        placeholder="e.g. span 2" /* i18n-exempt: example hint */
        value={(component as Record<string, unknown>)["gridColumn"] as string | undefined ?? ""}
        error={cssError("grid-column", (component as Record<string, unknown>)["gridColumn"] as string | undefined)}
        onChange={(e) =>
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "gridColumn",
            (e.target.value || undefined) as unknown,
          )
        }
      />
      <Input
        label={<span className="flex items-center gap-1">{/* i18n-exempt: builder field label */}Grid Row<Tooltip text="Line, span or range (e.g. '1 / span 3')">?</Tooltip></span>}
        placeholder="e.g. 1 / span 2" /* i18n-exempt: example hint */
        value={(component as Record<string, unknown>)["gridRow"] as string | undefined ?? ""}
        error={cssError("grid-row", (component as Record<string, unknown>)["gridRow"] as string | undefined)}
        onChange={(e) =>
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "gridRow",
            (e.target.value || undefined) as unknown,
          )
        }
      />
    </div>
  );
}
